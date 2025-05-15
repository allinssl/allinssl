package deploy

import (
	"ALLinSSL/backend/public"
	"fmt"
)

func Deploy(cfg map[string]any, logger *public.Logger) error {
	providerName, ok := cfg["provider"].(string)
	if !ok {
		return fmt.Errorf("provider is not string")
	}
	switch providerName {
	case "btpanel":
		logger.Debug("部署到宝塔面板...")
		return DeployBt(cfg)
	case "btpanel-site":
		logger.Debug("部署到宝塔面板网站...")
		return DeployBtSite(cfg)
	case "btwaf-site":
		logger.Debug("部署到宝塔WAF面板网站...")
		return DeployBtWafSite(cfg)
	case "tencentcloud-cdn":
		cfg["resource_type"] = "cdn"
		logger.Debug("部署到腾讯云CDN...")
		return DeployToTX(cfg)
	case "tencentcloud-cos":
		cfg["resource_type"] = "cos"
		logger.Debug("部署到腾讯云COS...")
		return DeployToTX(cfg)
	case "1panel":
		logger.Debug("部署到1Panel...")
		return Deploy1panel(cfg)
	case "1panel-site":
		logger.Debug("部署到1Panel网站...")
		return Deploy1panelSite(cfg)
	case "ssh":
		logger.Debug("使用ssh部署到指定路径...")
		return DeploySSH(cfg)
	case "aliyun-cdn":
		logger.Debug("部署到阿里云CDN...")
		return DeployAliCdn(cfg)
	case "aliyun-oss":
		logger.Debug("部署到阿里云OSS...")
		return DeployOss(cfg)
	case "safeline-site":
		logger.Debug("部署雷池WAF网站...")
		return DeploySafeLineWafSite(cfg, logger)
	case "safeline-panel":
		logger.Debug("部署雷池WAF面板...")
		return DeploySafeLineWaf(cfg)
	case "localhost":
		logger.Debug("部署到本地...")
		return DeployLocalhost(cfg)
	default:
		return fmt.Errorf("不支持的部署: %s", providerName)
	}
}
