package module

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

type process struct {
	cmd    *exec.Cmd
	input  io.WriteCloser
	token  string
	url    string
	done   chan struct{}
	active sync.WaitGroup
	ctx    context.Context
	cancel context.CancelFunc
}

type installed struct {
	Info
	root      string
	proc      *process
	published bool // 已发布的接管关系在重启和故障期间继续保留。
}

type storedPlugin struct {
	Enabled  bool     `json:"enabled"`
	Manifest Manifest `json:"manifest"`
}

type Manager struct {
	mu         sync.RWMutex
	actions    sync.Mutex
	dir        string
	dataDir    string
	stateFile  string
	plugins    map[string]*installed
	enabled    map[string]storedPlugin
	operations map[string]Operation
	server     *http.Server
	hostURL    string
	client     *http.Client
	closed     bool
}

func New(dir, dataDir string) (*Manager, error) {
	dir, err := filepath.Abs(dir)
	if err != nil {
		return nil, err
	}
	dataDir, err = filepath.Abs(dataDir)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return nil, err
	}
	m := &Manager{dir: dir, dataDir: dataDir, stateFile: filepath.Join(dataDir, "plugins.json"), plugins: map[string]*installed{}, enabled: map[string]storedPlugin{}, operations: map[string]Operation{}}
	if data, err := os.ReadFile(m.stateFile); err == nil {
		if err := json.Unmarshal(data, &m.enabled); err != nil {
			return nil, fmt.Errorf("读取插件启用配置失败: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	m.client = &http.Client{Transport: &http.Transport{Proxy: nil}, CheckRedirect: noRedirect}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	m.hostURL = "http://" + listener.Addr().String()
	m.server = &http.Server{Handler: http.HandlerFunc(m.serveOperation), ReadHeaderTimeout: 10 * time.Second}
	go m.server.Serve(listener)
	return m, nil
}

func noRedirect(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }

func (m *Manager) RegisterOperation(name string, operation Operation) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.operations[name] = operation
}

func (m *Manager) discover() error {
	entries, err := os.ReadDir(m.dir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		root := filepath.Join(m.dir, entry.Name())
		if _, err := os.Stat(filepath.Join(root, "plugin.json")); os.IsNotExist(err) {
			continue
		}
		manifest, manifestErr := readManifest(root, entry.Name())
		m.mu.Lock()
		previous := m.plugins[entry.Name()]
		if previous != nil && previous.Enabled {
			m.mu.Unlock()
			continue
		}
		item := &installed{Info: Info{Manifest: manifest, Status: "disabled"}, root: root}
		if manifestErr != nil {
			item.ID = entry.Name()
			item.Type = "module"
			item.Status = "invalid"
			item.Error = manifestErr.Error()
		}
		m.plugins[entry.Name()] = item
		m.mu.Unlock()
	}
	return nil
}

func (m *Manager) Start() error {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return fmt.Errorf("模块管理器已关闭")
	}
	if err := m.discover(); err != nil {
		return err
	}
	ids := make([]string, 0, len(m.enabled))
	for id, state := range m.enabled {
		if state.Enabled {
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	startIDs := make([]string, 0, len(ids))
	for _, id := range ids {
		m.mu.Lock()
		item := m.plugins[id]
		if item != nil && item.Enabled {
			m.mu.Unlock()
			continue
		}
		stored := m.enabled[id].Manifest
		currentJSON, _ := json.Marshal(itemManifest(item))
		storedJSON, _ := json.Marshal(stored)
		if item == nil || item.Status == "invalid" || !bytes.Equal(currentJSON, storedJSON) {
			message := "模块目录不存在"
			if item != nil {
				message = "模块清单已变化，请先停用再重新启用"
				if item.Error != "" {
					message = item.Error
				}
			}
			m.plugins[id] = &installed{Info: Info{Manifest: stored, Enabled: true, Status: "error", Error: message}, root: filepath.Join(m.dir, id), published: true}
			m.mu.Unlock()
			continue
		}
		item.Enabled = true
		item.published = true
		item.Status = "starting"
		startIDs = append(startIDs, id)
		m.mu.Unlock()
	}
	// 先保留全部接管关系，避免其他模块初始化时执行尚未启动模块的原业务。
	for _, id := range startIDs {
		if err := m.enable(id, false); err != nil {
			log.Printf("启动模块 %s 失败: %v", id, err)
		}
	}
	return nil
}

func itemManifest(item *installed) Manifest {
	if item == nil {
		return Manifest{}
	}
	return item.Manifest
}

func (m *Manager) List() ([]Info, error) {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return nil, fmt.Errorf("模块管理器已关闭")
	}
	if err := m.discover(); err != nil {
		return nil, err
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	items := make([]Info, 0, len(m.plugins))
	for _, item := range m.plugins {
		items = append(items, item.Info)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items, nil
}

func (m *Manager) Enable(id string) error {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return fmt.Errorf("模块管理器已关闭")
	}
	if err := m.discover(); err != nil {
		return err
	}
	return m.enable(id, true)
}

func (m *Manager) enable(id string, persist bool) error {
	m.mu.Lock()
	item := m.plugins[id]
	if item == nil {
		if !persist {
			m.plugins[id] = &installed{Info: Info{Manifest: Manifest{ID: id, Type: "module"}, Enabled: true, Status: "error", Error: "模块目录不存在"}, published: true}
		}
		m.mu.Unlock()
		return fmt.Errorf("模块不存在: %s", id)
	}
	if item.Enabled && persist {
		m.mu.Unlock()
		return fmt.Errorf("模块已启用，请使用重启")
	}
	if item.Status == "invalid" {
		if !persist {
			item.Enabled = true
		}
		m.mu.Unlock()
		return errors.New(item.Error)
	}
	if err := m.checkConflicts(item); err != nil {
		item.Error = err.Error()
		if !persist {
			item.Enabled = true
			item.Status = "error"
		}
		m.mu.Unlock()
		return err
	}
	item.Status = "starting"
	item.Error = ""
	// 首次启用在就绪并保存状态后才发布，重启保留原有接管关系。
	item.Enabled = true
	m.mu.Unlock()
	var err error
	if item.Backend != "" {
		err = m.launch(item)
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if err == nil && item.proc != nil && item.proc.ctx.Err() != nil {
		err = fmt.Errorf("模块就绪后退出")
	}
	if err != nil {
		item.Status = "error"
		item.Error = err.Error()
		item.Enabled = !persist
		return err
	}
	if persist {
		if err := m.saveState(id, true); err != nil {
			item.Enabled = false
			item.Status = "error"
			item.Error = err.Error()
			if item.proc != nil {
				item.proc.cancel()
				item.proc.input.Close()
				_ = item.proc.cmd.Process.Kill()
			}
			return err
		}
	}
	item.Status = "running"
	item.published = true
	return nil
}

func (m *Manager) checkConflicts(item *installed) error {
	claims := map[string]bool{}
	if item.Frontend.Root != "" {
		claims["frontend:root"] = true
	}
	for _, hook := range item.Hooks {
		if hook.Kind == "http" && m.operations[hook.Target] == nil {
			return fmt.Errorf("接口不是可扩展业务操作: %s", hook.Target)
		}
		if hook.Stage == "replace" {
			key := hook.Kind + ":" + hook.Target
			if claims[key] {
				return fmt.Errorf("模块重复声明替换点: %s", key)
			}
			claims[key] = true
		}
	}
	for _, permission := range item.Permissions {
		if m.operations[permission] == nil {
			return fmt.Errorf("不存在的业务权限: %s", permission)
		}
	}
	for _, page := range item.Frontend.Pages {
		key := "page:" + page.Name
		if page.Replace != "" {
			key = "page:" + page.Replace
		}
		if claims[key] {
			return fmt.Errorf("模块重复声明替换点: %s", key)
		}
		claims[key] = true
	}
	if item.Frontend.Login != "" && !claims["auth:request"] {
		return fmt.Errorf("登录入口需要认证扩展")
	}
	if item.Frontend.Login != "" {
		if claims["page:login"] {
			return fmt.Errorf("模块重复声明登录页替换")
		}
		claims["page:login"] = true
	}
	for id, other := range m.plugins {
		if id == item.ID || !other.Enabled {
			continue
		}
		if err := conflictsWith(claims, other.Manifest); err != nil {
			return fmt.Errorf("与模块 %s 冲突: %w", id, err)
		}
	}
	return nil
}

func conflictsWith(claims map[string]bool, other Manifest) error {
	if other.Frontend.Root != "" && claims["frontend:root"] {
		return fmt.Errorf("frontend:root")
	}
	if other.Frontend.Login != "" && claims["page:login"] {
		return fmt.Errorf("page:login")
	}
	for _, hook := range other.Hooks {
		if hook.Stage == "replace" && claims[hook.Kind+":"+hook.Target] {
			return fmt.Errorf("%s:%s", hook.Kind, hook.Target)
		}
	}
	for _, page := range other.Frontend.Pages {
		key := "page:" + page.Name
		if page.Replace != "" {
			key = "page:" + page.Replace
		}
		if claims[key] {
			return fmt.Errorf("%s", key)
		}
	}
	return nil
}

func (m *Manager) launch(item *installed) error {
	path, err := PackagePath(item.root, item.Backend)
	if err != nil {
		return err
	}
	dataDir := filepath.Join(m.dataDir, "plugins", item.ID)
	if err := os.MkdirAll(dataDir, 0700); err != nil {
		return err
	}
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return err
	}
	ctx, cancel := context.WithCancel(context.Background())
	p := &process{cmd: exec.Command(path), token: hex.EncodeToString(secret), done: make(chan struct{}), ctx: ctx, cancel: cancel}
	p.cmd.Dir = item.root
	p.cmd.Env = append(os.Environ(), "ALLINSSL_HOST_URL="+m.hostURL, "ALLINSSL_MODULE_TOKEN="+p.token, "ALLINSSL_MODULE_ID="+item.ID, "ALLINSSL_MODULE_DATA="+dataDir)
	p.cmd.Stderr = os.Stderr
	stdout, err := p.cmd.StdoutPipe()
	if err != nil {
		cancel()
		return err
	}
	p.input, err = p.cmd.StdinPipe()
	if err != nil {
		cancel()
		stdout.Close()
		return err
	}
	m.mu.Lock()
	item.proc = p
	m.mu.Unlock()
	if err := p.cmd.Start(); err != nil {
		cancel()
		stdout.Close()
		p.input.Close()
		close(p.done)
		return err
	}
	ready := make(chan error, 1)
	go readReady(stdout, p, ready)
	select {
	case err = <-ready:
	case <-time.After(10 * time.Second):
		err = fmt.Errorf("模块启动超过 10 秒")
	}
	if err != nil {
		cancel()
		p.input.Close()
		_ = p.cmd.Process.Kill()
		_ = p.cmd.Wait()
		close(p.done)
		return err
	}
	go m.waitProcess(item, p)
	return nil
}

func readReady(stdout io.ReadCloser, p *process, ready chan<- error) {
	reader := bufio.NewReader(io.LimitReader(stdout, 64*1024))
	line, err := reader.ReadBytes('\n')
	if err != nil {
		ready <- fmt.Errorf("读取模块就绪消息失败: %w", err)
		return
	}
	var message struct {
		Protocol int    `json:"protocol"`
		URL      string `json:"url"`
	}
	if err := json.Unmarshal(line, &message); err != nil {
		ready <- err
		return
	}
	address, err := url.Parse(message.URL)
	if err != nil {
		ready <- err
		return
	}
	if message.Protocol != 1 || address.Scheme != "http" || address.Hostname() != "127.0.0.1" || address.Port() == "" || address.User != nil || address.Path != "" || address.RawQuery != "" || address.Fragment != "" {
		ready <- fmt.Errorf("模块就绪地址必须为 http://127.0.0.1:端口，协议为 1")
		return
	}
	p.url = message.URL
	ready <- nil
	_, _ = io.Copy(io.Discard, stdout)
}

func (m *Manager) waitProcess(item *installed, p *process) {
	err := p.cmd.Wait()
	p.cancel()
	p.input.Close()
	m.mu.Lock()
	if item.proc == p && item.Status != "stopping" {
		item.Status = "error"
		item.Error = "模块进程已退出"
		if err != nil {
			item.Error += ": " + err.Error()
		}
	}
	m.mu.Unlock()
	close(p.done)
}

func (m *Manager) Disable(id string) error {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return fmt.Errorf("模块管理器已关闭")
	}
	m.mu.Lock()
	item := m.plugins[id]
	if item == nil {
		m.mu.Unlock()
		return fmt.Errorf("模块不存在: %s", id)
	}
	if err := m.saveState(id, false); err != nil {
		m.mu.Unlock()
		return err
	}
	item.Status = "stopping"
	p := item.proc
	m.mu.Unlock()
	stopProcess(p)
	m.mu.Lock()
	item.Enabled = false
	item.published = false
	item.Status = "disabled"
	item.Error = ""
	item.proc = nil
	m.mu.Unlock()
	return nil
}

func stopProcess(p *process) {
	if p == nil {
		return
	}
	drained := make(chan struct{})
	go func() { p.active.Wait(); close(drained) }()
	select {
	case <-drained:
	case <-time.After(5 * time.Second):
	}
	p.cancel()
	p.input.Close()
	select {
	case <-p.done:
	case <-time.After(5 * time.Second):
		_ = p.cmd.Process.Kill()
		<-p.done
	}
}

func (m *Manager) Restart(id string) error {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return fmt.Errorf("模块管理器已关闭")
	}
	m.mu.Lock()
	item := m.plugins[id]
	if item == nil || !item.Enabled {
		m.mu.Unlock()
		return fmt.Errorf("模块未启用: %s", id)
	}
	item.Status = "stopping"
	p := item.proc
	m.mu.Unlock()
	stopProcess(p)
	manifest, err := readManifest(item.root, id)
	currentJSON, _ := json.Marshal(manifest)
	originalJSON, _ := json.Marshal(item.Manifest)
	if err == nil && !bytes.Equal(currentJSON, originalJSON) {
		err = fmt.Errorf("模块清单已变化，请先停用再重新启用")
	}
	m.mu.Lock()
	item.proc = nil
	if err != nil {
		item.Status = "error"
		item.Error = err.Error()
	}
	m.mu.Unlock()
	if err != nil {
		return err
	}
	return m.enable(id, false)
}

func (m *Manager) Close() {
	m.actions.Lock()
	defer m.actions.Unlock()
	if m.closed {
		return
	}
	m.closed = true
	m.mu.Lock()
	processes := make([]*process, 0, len(m.plugins))
	for _, item := range m.plugins {
		item.Status = "stopping"
		processes = append(processes, item.proc)
	}
	m.mu.Unlock()
	for _, p := range processes {
		stopProcess(p)
	}
	_ = m.server.Close()
	m.client.CloseIdleConnections()
}

func (m *Manager) saveState(id string, enabled bool) error {
	state := make(map[string]storedPlugin, len(m.enabled)+1)
	for key, value := range m.enabled {
		state[key] = value
	}
	state[id] = storedPlugin{Enabled: enabled, Manifest: m.plugins[id].Manifest}
	if err := writeState(m.stateFile, state); err != nil {
		return err
	}
	m.enabled = state
	return nil
}

func writeState(path string, state map[string]storedPlugin) error {
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), ".plugins-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), path)
}

// DisableOnDisk 不访问 Web 或插件进程，认证模块损坏时仍能通过本机恢复。
func DisableOnDisk(dataDir, id string) error {
	if !identifier.MatchString(id) {
		return fmt.Errorf("模块标识无效")
	}
	path := filepath.Join(dataDir, "plugins.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var state map[string]storedPlugin
	if err := json.Unmarshal(data, &state); err != nil {
		return err
	}
	item, exists := state[id]
	if !exists {
		return fmt.Errorf("模块不存在: %s", id)
	}
	item.Enabled = false
	state[id] = item
	return writeState(path, state)
}

func (m *Manager) Call(ctx context.Context, id string, call Invoke) (Reply, error) {
	m.mu.RLock()
	item := m.plugins[id]
	if item == nil || !item.Enabled || item.Status != "running" || item.proc == nil {
		message := "模块不可用"
		if item != nil && item.Error != "" {
			message = item.Error
		}
		m.mu.RUnlock()
		return Reply{}, fmt.Errorf("模块 %s: %s", id, message)
	}
	p := item.proc
	p.active.Add(1)
	m.mu.RUnlock()
	defer p.active.Done()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	stop := context.AfterFunc(p.ctx, cancel)
	defer stop()
	data, err := json.Marshal(call)
	if err != nil {
		return Reply{}, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", p.url+"/invoke", bytes.NewReader(data))
	if err != nil {
		return Reply{}, err
	}
	req.Header.Set("Authorization", "Bearer "+p.token)
	req.Header.Set("Content-Type", "application/json")
	response, err := m.client.Do(req)
	if err != nil {
		return Reply{}, fmt.Errorf("模块 %s 调用失败: %w", id, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return Reply{}, fmt.Errorf("模块 %s 返回 HTTP %d", id, response.StatusCode)
	}
	var reply Reply
	if err := json.NewDecoder(response.Body).Decode(&reply); err != nil {
		return reply, fmt.Errorf("模块 %s 响应无效: %w", id, err)
	}
	if reply.Error != "" {
		return reply, fmt.Errorf("模块 %s: %s", id, reply.Error)
	}
	return reply, nil
}

func (m *Manager) serveOperation(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" || r.URL.Path != "/call" {
		http.NotFound(w, r)
		return
	}
	token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	m.mu.RLock()
	var item *installed
	for _, candidate := range m.plugins {
		if candidate.Enabled && candidate.proc != nil && candidate.proc.token == token && (candidate.Status == "running" || candidate.Status == "starting") {
			item = candidate
			break
		}
	}
	if item == nil {
		m.mu.RUnlock()
		http.Error(w, "插件凭据无效", http.StatusUnauthorized)
		return
	}
	var call struct {
		Operation string         `json:"operation"`
		Params    map[string]any `json:"params"`
	}
	m.mu.RUnlock()
	if err := json.NewDecoder(r.Body).Decode(&call); err != nil {
		http.Error(w, "业务请求无效", http.StatusBadRequest)
		return
	}
	m.mu.RLock()
	if item.proc == nil || item.proc.token != token || (item.Status != "running" && item.Status != "starting") {
		m.mu.RUnlock()
		http.Error(w, "插件凭据已失效", http.StatusUnauthorized)
		return
	}
	allowed := false
	for _, permission := range item.Permissions {
		if permission == call.Operation {
			allowed = true
			break
		}
	}
	operation := m.operations[call.Operation]
	if !allowed || operation == nil {
		m.mu.RUnlock()
		http.Error(w, "没有此业务操作权限", http.StatusForbidden)
		return
	}
	p := item.proc
	p.active.Add(1)
	m.mu.RUnlock()
	defer p.active.Done()
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	stop := context.AfterFunc(p.ctx, cancel)
	defer stop()
	response, err := operation(ctx, call.Params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}
