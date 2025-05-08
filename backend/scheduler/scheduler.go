package scheduler

import (
	"context"
	"sync"
	"time"
)

// 你的任务列表
var funcs = []func(){
	SiteMonitor,
	RunWorkflows,
}

// Scheduler 控制器
type Scheduler struct {
	mu         sync.Mutex
	ctx        context.Context
	cancelFunc context.CancelFunc
	running    bool
	wg         sync.WaitGroup
}

// 启动调度器（在 goroutine 中运行）
func (s *Scheduler) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return
	}

	s.ctx, s.cancelFunc = context.WithCancel(context.Background())
	s.running = true
	s.wg.Add(1)

	go s.loop() // goroutine 中运行任务调度
}

// 停止调度器
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	s.cancelFunc()    // 取消上下文
	s.wg.Wait()       // 等待 goroutine 完成退出
	s.running = false // 标记为未运行
}

// 重启调度器
func (s *Scheduler) Restart() {
	s.Stop()
	time.Sleep(500 * time.Millisecond) // 可选，避免 race
	s.Start()
}

// 调度主循环（内部）
func (s *Scheduler) loop() {
	defer s.wg.Done()

	for {
		// fmt.Println("Scheduler loop")
		select {
		case <-s.ctx.Done():
			return // 外部关闭信号，退出
		default:
			start := time.Now()

			var taskWg sync.WaitGroup
			taskWg.Add(len(funcs))

			for _, f := range funcs {
				go func(fn func()) {
					defer taskWg.Done()
					fn()
				}(f)
			}
			taskWg.Wait()

			// 间隔控制
			elapsed := time.Since(start)
			if elapsed < 10*time.Second {
				select {
				case <-time.After(10*time.Second - elapsed):
				case <-s.ctx.Done():
					return
				}
			}
		}
	}
}
