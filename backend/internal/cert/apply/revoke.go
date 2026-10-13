package apply

import (
	"ALLinSSL/backend/internal/cert"
	"ALLinSSL/backend/public"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-acme/lego/v4/certcrypto"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/log"
)

// GetRegisteredAcmeClient 加载已注册的 ACME 账户客户端；不存在或未注册则返回错误（不会自动注册新账户）。
func GetRegisteredAcmeClient(email, ca string, logger *public.Logger) (*lego.Client, error) {
	if email == "" {
		return nil, fmt.Errorf("ACME 账户邮箱不能为空")
	}
	if ca == "" || ca == "letsencrypt" {
		ca = "Let's Encrypt"
	}

	db, err := GetSqlite()
	if err != nil {
		return nil, fmt.Errorf("连接账户数据库失败: %w", err)
	}
	defer db.Close()

	accData, err := GetAccount(db, email, ca)
	if err != nil || accData == nil {
		return nil, fmt.Errorf("未找到 CA【%s】下邮箱为 %s 的 ACME 账户，请先在账号管理中确认", ca, email)
	}

	user := GetAcmeUser(email, logger, accData)
	if user == nil || user.Registration == nil {
		return nil, fmt.Errorf("ACME 账户 %s 尚未完成注册，无法吊销。请先用该账户成功申请过一次证书", email)
	}
	if user.GetPrivateKey() == nil {
		return nil, fmt.Errorf("ACME 账户 %s 私钥不可用", email)
	}

	CADirURL := CADirURLMap[ca]
	if CADirURL == "" {
		if v, ok := accData["CADirURL"].(string); ok && v != "" {
			CADirURL = v
		}
	}
	if CADirURL == "" {
		return nil, fmt.Errorf("未找到 CA【%s】的目录地址", ca)
	}

	config := lego.NewConfig(user)
	config.Certificate.KeyType = certcrypto.RSA2048
	config.CADirURL = CADirURL
	config.Certificate.Timeout = 60 * time.Second

	client, err := lego.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("创建 ACME 客户端失败: %w", err)
	}
	return client, nil
}

// RevokeCert 向公网 CA 发起 ACME 吊销，并更新本地证书状态。
// id 支持逗号分隔批量吊销；reason 使用 RFC 5280 §5.3.1 原因码。
func RevokeCert(id string, reason int, reasonNote string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return fmt.Errorf("ID不能为空")
	}
	reasonStr, err := cert.FormatRevokeReason(reason, reasonNote)
	if err != nil {
		return err
	}

	ids := strings.Split(id, ",")
	var (
		okCount   int
		lastError error
		messages  []string
	)
	for _, rawID := range ids {
		rawID = strings.TrimSpace(rawID)
		if rawID == "" {
			continue
		}
		if err := revokeOneCert(rawID, reason, reasonStr); err != nil {
			lastError = err
			messages = append(messages, fmt.Sprintf("#%s: %v", rawID, err))
			continue
		}
		okCount++
	}
	if okCount == 0 {
		if lastError != nil {
			if len(messages) == 1 {
				return lastError
			}
			return fmt.Errorf("全部吊销失败: %s", strings.Join(messages, "; "))
		}
		return fmt.Errorf("ID不能为空")
	}
	if len(messages) > 0 {
		return fmt.Errorf("成功 %d 个，失败 %d 个: %s", okCount, len(messages), strings.Join(messages, "; "))
	}
	return nil
}

func revokeOneCert(id string, reason int, reasonStr string) error {
	row, err := cert.GetCertRow(id)
	if err != nil {
		return err
	}
	if status, _ := row["status"].(string); status == cert.CertStatusRevoked {
		return fmt.Errorf("证书已吊销，无需重复操作")
	}
	source, _ := row["source"].(string)
	if source == "upload" {
		return fmt.Errorf("上传证书无法通过 ACME 吊销，请直接删除本地记录")
	}

	certPEM, _ := row["cert"].(string)
	if certPEM == "" {
		return fmt.Errorf("证书内容为空")
	}

	email, _ := row["acme_email"].(string)
	ca, _ := row["acme_ca"].(string)
	if email == "" {
		return fmt.Errorf("该证书未记录 ACME 账户邮箱，无法自动吊销")
	}
	if ca == "" {
		ca = "Let's Encrypt"
	}

	logPath := filepath.Join("logs", "acme_revoke.log")
	_ = os.MkdirAll(filepath.Dir(logPath), 0o755)
	logger, err := public.NewLogger(logPath)
	if err != nil {
		logger, err = public.NewLogger(filepath.Join("logs", "workflows", "acme_revoke.log"))
		if err != nil {
			return fmt.Errorf("初始化吊销日志失败: %v", err)
		}
	}
	defer logger.Close()
	log.Logger = logger.GetLogger()

	client, err := GetRegisteredAcmeClient(email, ca, logger)
	if err != nil {
		return err
	}

	reasonUint := uint(reason)
	if err := client.Certificate.RevokeWithReason([]byte(certPEM), &reasonUint); err != nil {
		errMsg := strings.ToLower(err.Error())
		if !strings.Contains(errMsg, "alreadyrevoked") && !strings.Contains(errMsg, "already revoked") {
			return fmt.Errorf("向 CA 吊销失败: %v", err)
		}
		logger.Debug("CA 返回证书已吊销，同步本地状态")
	}

	if err := cert.MarkCertRevoked(row["id"], reasonStr); err != nil {
		return fmt.Errorf("CA 侧已处理，但更新本地状态失败: %v", err)
	}
	return nil
}
