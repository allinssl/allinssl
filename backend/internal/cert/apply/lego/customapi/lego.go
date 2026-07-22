// Package customapi 自定义HTTP(S) 作为 DNS 提供商：
// 用多步请求配置执行 DNS-01 挑战记录的写入(present)与清理(cleanup)。
package customapi

import (
	"ALLinSSL/backend/internal/customapi"
	"ALLinSSL/backend/public"
	"fmt"
	"time"

	"github.com/go-acme/lego/v4/challenge/dns01"
)

type Config struct {
	ProviderConfig     *customapi.Config
	Logger             *public.Logger
	PropagationTimeout time.Duration
	PollingInterval    time.Duration
}

type DNSProvider struct {
	config *Config
}

func NewConfig(cfg *customapi.Config, logger *public.Logger) *Config {
	return &Config{
		ProviderConfig:     cfg,
		Logger:             logger,
		PropagationTimeout: dns01.DefaultPropagationTimeout,
		PollingInterval:    dns01.DefaultPollingInterval,
	}
}

func NewDNSProviderConfig(config *Config) (*DNSProvider, error) {
	if config == nil || config.ProviderConfig == nil {
		return nil, fmt.Errorf("配置不能为空")
	}
	return &DNSProvider{config: config}, nil
}

func (d *DNSProvider) Timeout() (timeout, interval time.Duration) {
	return d.config.PropagationTimeout, d.config.PollingInterval
}

func (d *DNSProvider) Present(domain, token, keyAuth string) error {
	return d.send(domain, token, keyAuth, "present")
}

func (d *DNSProvider) CleanUp(domain, token, keyAuth string) error {
	return d.send(domain, token, keyAuth, "cleanup")
}

// send 执行提供方配置的多步请求，注入挑战变量：
// {{domain}}/{{fqdn}} 完整记录名、{{value}} TXT 记录值、{{token}}、{{action}}(present/cleanup)
func (d *DNSProvider) send(domain, token, keyAuth, action string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)
	vars := map[string]string{
		"domain": info.EffectiveFQDN,
		"fqdn":   info.EffectiveFQDN,
		"value":  info.Value,
		"token":  token,
		"action": action,
	}
	_, err := customapi.Execute(d.config.ProviderConfig, vars, d.config.Logger)
	return err
}
