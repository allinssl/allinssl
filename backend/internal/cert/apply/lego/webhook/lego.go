package webhook

import (
	"ALLinSSL/backend/public"
	"fmt"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"time"
)

var configData string

type Config struct {
	WebhookConfig *public.WebhookConfig

	PropagationTimeout time.Duration
	PollingInterval    time.Duration
	TTL                int
	HTTPTimeout        time.Duration
}

type DNSProvider struct {
	config *Config
}

func NewConfig(WebhookConfigStr map[string]string) *Config {
	fmt.Println(WebhookConfigStr)

	WebhookConfig := &public.WebhookConfig{
		Url:       WebhookConfigStr["url"],
		Data:      WebhookConfigStr["data"],
		Method:    WebhookConfigStr["method"],
		Headers:   WebhookConfigStr["headers"],
		IgnoreSSL: WebhookConfigStr["ignore_ssl"] == "true",
	}
	fmt.Println(WebhookConfig.Url)

	return &Config{
		WebhookConfig:      WebhookConfig,
		TTL:                600,
		PropagationTimeout: dns01.DefaultPropagationTimeout,
		PollingInterval:    dns01.DefaultPollingInterval,
		HTTPTimeout:        30 * time.Second,
	}
}

func NewDNSProviderConfig(config *Config) (*DNSProvider, error) {
	if config == nil {
		return nil, fmt.Errorf("配置不能为空")
	}
	return &DNSProvider{config: config}, nil
}

func (d *DNSProvider) Timeout() (timeout, interval time.Duration) {
	return d.config.PropagationTimeout, d.config.PollingInterval
}

func (d *DNSProvider) Present(domain, token, keyAuth string) error {
	configData = d.config.WebhookConfig.Data
	return d.send(domain, token, keyAuth, "present")
}

func (d *DNSProvider) CleanUp(domain, token, keyAuth string) error {
	d.config.WebhookConfig.Data = configData
	return d.send(domain, token, keyAuth, "cleanup")
}

func (d *DNSProvider) send(domain, token, keyAuth, action string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	data, err := public.ReplaceJSONPlaceholders(d.config.WebhookConfig.Data, map[string]interface{}{"domain": info.EffectiveFQDN, "token": token, "keyAuth": info.Value, "action": action})
	if err != nil {
		return fmt.Errorf("替换JSON占位符失败: %w", err)
	}
	d.config.WebhookConfig.Data = data
	return d.config.WebhookConfig.Send()
}
