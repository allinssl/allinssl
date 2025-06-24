package deploy

import (
	"ALLinSSL/backend/internal/cert/deploy/aliyun"
	"ALLinSSL/backend/internal/cert/deploy/doge"
	"ALLinSSL/backend/internal/cert/deploy/plugin"
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
	case "btpanel-dockersite":
		logger.Debug("部署到宝塔Docker面板网站...")
		return DeployBtDockerSite(cfg)
	case "btpanel-singlesite":
		logger.Debug("部署到旧版本宝塔单个站点...")
		return DeployBtSingleSite(cfg)
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
	case "tencentcloud-waf":
		cfg["resource_type"] = "waf"
		logger.Debug("部署到腾讯云WAF...")
		return DeployToTX(cfg)
	case "tencentcloud-teo":
		cfg["resource_type"] = "teo"
		logger.Debug("部署到腾讯云EdgeOne...")
		return DeployToTX(cfg)
	case "1panel":
		logger.Debug("部署到1Panel...")
		return Deploy1panel(cfg)
	case "1panel-site":
		logger.Debug("部署到1Panel网站...")
		return Deploy1panelSite(cfg)
	case "ssh":
		logger.Debug("使用ssh部署到指定路径...")
		return DeploySSH(cfg, logger)
	case "aliyun-cdn":
		logger.Debug("部署到阿里云CDN...")
		return DeployAliCdn(cfg)
	case "aliyun-oss":
		logger.Debug("部署到阿里云OSS...")
		return DeployOss(cfg)
	case "aliyun-waf":
		logger.Debug("部署到阿里云WAF...")
		return DeployAliyunWaf(cfg)
	case "aliyun-esa":
		logger.Debug("部署到阿里云ESA...")
		return aliyun.DeployAliyunESA(cfg)
	case "safeline-site":
		logger.Debug("部署雷池WAF网站...")
		return DeploySafeLineWafSite(cfg, logger)
	case "safeline-panel":
		logger.Debug("部署雷池WAF面板...")
		return DeploySafeLineWaf(cfg)
	case "localhost":
		logger.Debug("部署到本地...")
		return DeployLocalhost(cfg)
	case "qiniu-cdn":
		logger.Debug("部署到七牛云CDN...")
		return DeployQiniuCdn(cfg)
	case "qiniu-oss":
		logger.Debug("部署到七牛云OSS...")
		return DeployQiniuOss(cfg)
	case "baidu-cdn":
		logger.Debug("部署到百度云CDN...")
		return DeployBaiduCdn(cfg)
	case "huaweicloud-cdn":
		logger.Debug("部署到华为云CDN...")
		return DeployHwCdn(cfg)
	case "volcengine-cdn":
		logger.Debug("部署到火山CDN...")
		return DeployVolcEngineCdn(cfg)
	case "volcengine-dcdn":
		logger.Debug("部署到火山DCDN...")
		return DeployVolcEngineDCdn(cfg)
	case "doge-cdn":
		logger.Debug("部署到多吉云CDN...")
		return doge.DeployCdn(cfg)
	case "plugin":
		logger.Debug("使用插件部署...")
		return plugin.Deploy(cfg, logger)
	default:
		return fmt.Errorf("不支持的部署: %s", providerName)
	}
}
