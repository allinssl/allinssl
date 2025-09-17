package bt

import (
	"fmt"
	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"github.com/go-acme/lego/v4/platform/config/env"
	"time"
)

const (
	envNamespace = "BTDOMAIN_"

	EnvAccountID = envNamespace + "ACCOUNT_ID"
	EnvAccessKey = envNamespace + "ACCESS_KEY"
	EnvSecretKey = envNamespace + "SECRET_KEY"
	EnvBaseURL   = envNamespace + "BASE_URL"

	EnvTTL                = envNamespace + "TTL"
	EnvPropagationTimeout = envNamespace + "PROPAGATION_TIMEOUT"
	EnvPollingInterval    = envNamespace + "POLLING_INTERVAL"
	EnvHTTPTimeout        = envNamespace + "HTTP_TIMEOUT"
)

var _ challenge.ProviderTimeout = (*DNSProvider)(nil)

type Config struct {
	AccountID string
	AccessKey string
	SecretKey string
	BaseURL   string

	PropagationTimeout time.Duration
	PollingInterval    time.Duration
	TTL                int
	HTTPTimeout        time.Duration
}

func NewConfig(accountID, accessKey, secretKey, baseURL string) *Config {

	return &Config{
		AccountID:          accountID,
		AccessKey:          accessKey,
		SecretKey:          secretKey,
		BaseURL:            baseURL,
		TTL:                600,
		PropagationTimeout: dns01.DefaultPropagationTimeout,
		PollingInterval:    dns01.DefaultPollingInterval,
		HTTPTimeout:        30 * time.Second,
	}
}

func NewDefaultConfig() *Config {
	return &Config{
		BaseURL: env.GetOrDefaultString(EnvBaseURL, "https://dmp.bt.cn"),

		TTL:                env.GetOrDefaultInt(EnvTTL, 600),
		PropagationTimeout: env.GetOrDefaultSecond(EnvPropagationTimeout, dns01.DefaultPropagationTimeout),
		PollingInterval:    env.GetOrDefaultSecond(EnvPollingInterval, dns01.DefaultPollingInterval),
		HTTPTimeout:        env.GetOrDefaultSecond(EnvHTTPTimeout, 30*time.Second),
	}
}

type DNSProvider struct {
	config *Config
}

func NewDNSProvider() (*DNSProvider, error) {
	values, err := env.Get(EnvAccountID, EnvAccessKey, EnvSecretKey)
	if err != nil {
		return nil, fmt.Errorf("westcn: %w", err)
	}

	config := NewDefaultConfig()
	config.AccountID = values[EnvAccountID]
	config.AccessKey = values[EnvAccessKey]
	config.SecretKey = values[EnvSecretKey]

	return NewDNSProviderConfig(config)
}

func NewDNSProviderConfig(config *Config) (*DNSProvider, error) {
	if config == nil {
		return nil, nil
	}
	return &DNSProvider{config: config}, nil
}

func (d *DNSProvider) Timeout() (timeout, interval time.Duration) {
	return d.config.PropagationTimeout, d.config.PollingInterval
}

func (d *DNSProvider) Present(domain, token, keyAuth string) error {
	return d.config.addDNSRecord(domain, keyAuth)
}

func (d *DNSProvider) CleanUp(domain, token, keyAuth string) error {
	return d.config.removeDNSRecord(domain, keyAuth)
}

func (c *Config) GetDomainId(domain string) (int, int) {
	domain = dns01.UnFqdn(domain)
	resp, err := c.MakeRequest("POST", "/api/v1/dns/manage/list_domains", map[string]interface{}{
		"p":       "1",
		"rows":    "100",
		"keyword": domain,
	})
	if err != nil {
		return 0, 0
	}
	if !resp["status"].(bool) {
		return 0, 0
	}
	data := resp["data"].(map[string]interface{})
	list := data["data"].([]interface{})
	for _, item := range list {
		d := item.(map[string]interface{})
		if d["full_domain"].(string) == domain {
			return int(d["local_id"].(float64)), int(d["domain_type"].(float64))
		}
	}
	return 0, 0
}

func (c *Config) addDNSRecord(domain, keyAuth string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	EffectiveFQDN := dns01.UnFqdn(info.EffectiveFQDN)
	rootDomain, err := dns01.FindZoneByFqdn(info.EffectiveFQDN)
	if err != nil {
		return fmt.Errorf("无法获取域名的根域名: %w", err)
	}
	subDomain, err := dns01.ExtractSubDomain(EffectiveFQDN, rootDomain)
	if err != nil {
		return fmt.Errorf("无法获取域名的子域名: %w", err)
	}

	domainId, domainType := c.GetDomainId(rootDomain)
	if domainId == 0 {
		return nil
	}
	_, err = c.MakeRequest("POST", "/api/v1/dns/record/create", map[string]interface{}{
		"domain_id":   domainId,
		"domain_type": domainType,
		"record":      subDomain,
		"value":       info.Value,
		"type":        "TXT",
	})
	return err
}

func (c *Config) removeDNSRecord(domain, keyAuth string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	EffectiveFQDN := dns01.UnFqdn(info.EffectiveFQDN)
	rootDomain, err := dns01.FindZoneByFqdn(info.EffectiveFQDN)
	if err != nil {
		return fmt.Errorf("无法获取域名的根域名: %w", err)
	}
	subDomain, err := dns01.ExtractSubDomain(EffectiveFQDN, rootDomain)
	if err != nil {
		return fmt.Errorf("无法获取域名的子域名: %w", err)
	}

	domainId, domainType := c.GetDomainId(rootDomain)
	if domainId == 0 {
		return nil
	}

	resp, err := c.MakeRequest("POST", "/api/v1/dns/record/list", map[string]interface{}{
		"domain_id":   domainId,
		"domain_type": domainType,
		"p":           "1",
		"rows":        "100",
		"searchKey":   subDomain,
	})
	if err != nil {
		return err
	}
	if !resp["status"].(bool) {
		return nil
	}
	data := resp["data"].(map[string]interface{})
	list := data["data"].([]interface{})
	for _, item := range list {
		d := item.(map[string]interface{})
		if d["record"].(string) == subDomain && d["type"].(string) == "TXT" && d["value"].(string) == info.Value {
			_, err = c.MakeRequest("POST", "/api/v1/dns/record/delete", map[string]interface{}{
				"domain_id":   domainId,
				"domain_type": domainType,
				"record_id":   int(d["record_id"].(float64)),
			})
			return err
		}
	}
	return nil
}
