// This file is originally from Certimate by fudiwei
// Source: https://github.com/usual2970/certimate/blob/main/internal/pkg/core/applicant/acme-dns-01/lego-providers/jdcloud/jdcloud.go
// License: MIT

package jdcloud

import (
	"errors"
	"fmt"
	"time"

	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"github.com/go-acme/lego/v4/platform/config/env"
	jdcore "github.com/jdcloud-api/jdcloud-sdk-go/core"
	jddnsapi "github.com/jdcloud-api/jdcloud-sdk-go/services/domainservice/apis"
	jddnsclient "github.com/jdcloud-api/jdcloud-sdk-go/services/domainservice/client"
	jddnsmodel "github.com/jdcloud-api/jdcloud-sdk-go/services/domainservice/models"
)

const (
	envNamespace = "JDCLOUD_"

	EnvAccessKeyID     = envNamespace + "ACCESS_KEY_ID"
	EnvAccessKeySecret = envNamespace + "ACCESS_KEY_SECRET"
	EnvRegionId        = envNamespace + "REGION_ID"

	EnvTTL                = envNamespace + "TTL"
	EnvPropagationTimeout = envNamespace + "PROPAGATION_TIMEOUT"
	EnvPollingInterval    = envNamespace + "POLLING_INTERVAL"
	EnvHTTPTimeout        = envNamespace + "HTTP_TIMEOUT"
)

var _ challenge.ProviderTimeout = (*DNSProvider)(nil)

type Config struct {
	AccessKeyID     string
	AccessKeySecret string
	RegionId        string

	PropagationTimeout time.Duration
	PollingInterval    time.Duration
	TTL                int32
	HTTPTimeout        time.Duration
}

type DNSProvider struct {
	client *jddnsclient.DomainserviceClient
	config *Config
}

func NewDefaultConfig() *Config {
	return &Config{
		TTL:                int32(env.GetOrDefaultInt(EnvTTL, 300)),
		PropagationTimeout: env.GetOrDefaultSecond(EnvPropagationTimeout, 2*time.Minute),
		PollingInterval:    env.GetOrDefaultSecond(EnvPollingInterval, dns01.DefaultPollingInterval),
		HTTPTimeout:        env.GetOrDefaultSecond(EnvHTTPTimeout, 30*time.Second),
	}
}

func NewDNSProvider() (*DNSProvider, error) {
	values, err := env.Get(EnvAccessKeyID, EnvAccessKeySecret)
	if err != nil {
		return nil, fmt.Errorf("jdcloud: %w", err)
	}

	config := NewDefaultConfig()
	config.AccessKeyID = values[EnvAccessKeyID]
	config.AccessKeySecret = values[EnvAccessKeySecret]
	config.RegionId = values[EnvRegionId]

	return NewDNSProviderConfig(config)
}

func NewDNSProviderConfig(config *Config) (*DNSProvider, error) {
	if config == nil {
		return nil, errors.New("jdcloud: the configuration of the DNS provider is nil")
	}

	clientCredentials := jdcore.NewCredentials(config.AccessKeyID, config.AccessKeySecret)
	client := jddnsclient.NewDomainserviceClient(clientCredentials)
	clientConfig := &client.Config
	clientConfig.SetTimeout(config.HTTPTimeout)
	client.SetConfig(clientConfig)
	client.SetLogger(jdcore.NewDefaultLogger(jdcore.LogWarn))

	return &DNSProvider{
		client: client,
		config: config,
	}, nil
}

func (d *DNSProvider) Present(domain, token, keyAuth string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	authZone, err := dns01.FindZoneByFqdn(info.EffectiveFQDN)
	if err != nil {
		return fmt.Errorf("jdcloud: could not find zone for domain %q: %w", domain, err)
	}

	subDomain, err := dns01.ExtractSubDomain(info.EffectiveFQDN, authZone)
	if err != nil {
		return fmt.Errorf("jdcloud: %w", err)
	}

	if err := d.addOrUpdateDNSRecord(dns01.UnFqdn(authZone), subDomain, info.Value); err != nil {
		return fmt.Errorf("jdcloud: %w", err)
	}

	return nil
}

func (d *DNSProvider) CleanUp(domain, token, keyAuth string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	authZone, err := dns01.FindZoneByFqdn(info.EffectiveFQDN)
	if err != nil {
		return fmt.Errorf("jdcloud: could not find zone for domain %q: %w", domain, err)
	}

	subDomain, err := dns01.ExtractSubDomain(info.EffectiveFQDN, authZone)
	if err != nil {
		return fmt.Errorf("jdcloud: %w", err)
	}

	if err := d.removeDNSRecord(dns01.UnFqdn(authZone), subDomain); err != nil {
		return fmt.Errorf("jdcloud: %w", err)
	}

	return nil
}

func (d *DNSProvider) Timeout() (timeout, interval time.Duration) {
	return d.config.PropagationTimeout, d.config.PollingInterval
}

func (d *DNSProvider) getDNSZone(zoneName string) (*jddnsmodel.DomainInfo, error) {
	pageNumber := 1
	pageSize := 10
	for {
		request := jddnsapi.NewDescribeDomainsRequest(d.config.RegionId, pageNumber, pageSize)
		request.SetDomainName(zoneName)

		response, err := d.client.DescribeDomains(request)
		if err != nil {
			return nil, err
		}

		for _, item := range response.Result.DataList {
			if item.DomainName == zoneName {
				return &item, nil
			}
		}

		if len(response.Result.DataList) < pageSize {
			break
		}

		pageNumber++
	}

	return nil, fmt.Errorf("jdcloud: zone %s not found", zoneName)
}

func (d *DNSProvider) getDNSZoneAndRecord(zoneName, subDomain string) (*jddnsmodel.DomainInfo, *jddnsmodel.RRInfo, error) {
	zone, err := d.getDNSZone(zoneName)
	if err != nil {
		return nil, nil, err
	}

	pageNumber := 1
	pageSize := 10
	for {
		request := jddnsapi.NewDescribeResourceRecordRequest(d.config.RegionId, fmt.Sprintf("%d", zone.Id))
		request.SetSearch(subDomain)
		request.SetPageNumber(pageNumber)
		request.SetPageSize(pageSize)

		response, err := d.client.DescribeResourceRecord(request)
		if err != nil {
			return zone, nil, err
		}

		for _, record := range response.Result.DataList {
			if record.Type == "TXT" && record.HostRecord == subDomain {
				return zone, &record, nil
			}
		}

		if len(response.Result.DataList) < pageSize {
			break
		}

		pageNumber++
	}

	return zone, nil, nil
}

func (d *DNSProvider) addOrUpdateDNSRecord(zoneName, subDomain, value string) error {
	zone, record, err := d.getDNSZoneAndRecord(zoneName, subDomain)
	if err != nil {
		return err
	}

	if record == nil {
		request := jddnsapi.NewCreateResourceRecordRequest(d.config.RegionId, fmt.Sprintf("%d", zone.Id), &jddnsmodel.AddRR{
			Type:       "TXT",
			HostRecord: subDomain,
			HostValue:  value,
			Ttl:        int(d.config.TTL),
			ViewValue:  -1,
		})
		_, err := d.client.CreateResourceRecord(request)
		return err
	} else {
		request := jddnsapi.NewModifyResourceRecordRequest(d.config.RegionId, fmt.Sprintf("%d", zone.Id), fmt.Sprintf("%d", record.Id), &jddnsmodel.UpdateRR{
			Type:       "TXT",
			HostRecord: subDomain,
			HostValue:  value,
			Ttl:        int(d.config.TTL),
			ViewValue:  -1,
		})
		_, err := d.client.ModifyResourceRecord(request)
		return err
	}
}

func (d *DNSProvider) removeDNSRecord(zoneName, subDomain string) error {
	zone, record, err := d.getDNSZoneAndRecord(zoneName, subDomain)
	if err != nil {
		return err
	}

	if record == nil {
		return nil
	} else {
		request := jddnsapi.NewDeleteResourceRecordRequest(d.config.RegionId, fmt.Sprintf("%d", zone.Id), fmt.Sprintf("%d", record.Id))
		_, err = d.client.DeleteResourceRecord(request)
		return err
	}
}
