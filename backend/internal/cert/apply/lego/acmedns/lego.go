package acmedns

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	legoacmedns "github.com/go-acme/lego/v4/providers/dns/acmedns"
	"github.com/nrdcg/goacmedns"
)

type Config struct {
	ServerURL   string `json:"server_url"`
	Credentials string `json:"credentials"`
}

type acmeDNSUpdater interface {
	UpdateTXTRecord(ctx context.Context, account goacmedns.Account, value string) error
}

type singleAccountProvider struct {
	account goacmedns.Account
	client  acmeDNSUpdater
}

var _ challenge.Provider = (*singleAccountProvider)(nil)

func NewDNSProviderConfig(config *Config) (challenge.Provider, error) {
	if config == nil {
		return nil, errors.New("acme-dns: the configuration of the DNS provider is nil")
	}

	serverURL := strings.TrimSpace(config.ServerURL)
	if serverURL == "" {
		return nil, errors.New("acme-dns: server_url is required")
	}

	credentials := strings.TrimSpace(config.Credentials)
	if credentials == "" {
		return nil, errors.New("acme-dns: credentials is required")
	}

	if isAccountMappingCredentials(credentials) {
		return newStorageBackedProvider(serverURL, credentials)
	}

	account, err := parseSingleAccountCredentials(credentials)
	if err != nil {
		return nil, err
	}

	client, err := goacmedns.NewClient(serverURL)
	if err != nil {
		return nil, err
	}

	account.ServerURL = serverURL

	return &singleAccountProvider{
		account: account,
		client:  client,
	}, nil
}

func createTempCredentialsFile(credentials string) (string, error) {
	tempFile, err := os.CreateTemp("", "allinssl-acmedns-*.json")
	if err != nil {
		return "", fmt.Errorf("acme-dns: failed to create temp credentials file: %w", err)
	}
	defer tempFile.Close()

	if _, err := tempFile.WriteString(credentials); err != nil {
		return "", fmt.Errorf("acme-dns: failed to write temp credentials file: %w", err)
	}

	return tempFile.Name(), nil
}

func (p *singleAccountProvider) Present(domain, _, keyAuth string) error {
	info := dns01.GetChallengeInfo(domain, keyAuth)

	return p.client.UpdateTXTRecord(context.Background(), p.account, info.Value)
}

func (p *singleAccountProvider) CleanUp(_, _, _ string) error {
	return nil
}

func isAccountMappingCredentials(credentials string) bool {
	var accounts map[string]goacmedns.Account

	return json.Unmarshal([]byte(credentials), &accounts) == nil
}

func parseSingleAccountCredentials(credentials string) (goacmedns.Account, error) {
	var account goacmedns.Account

	if err := json.Unmarshal([]byte(credentials), &account); err != nil {
		return goacmedns.Account{}, fmt.Errorf("acme-dns: credentials must be either a /register account JSON or a map[domain]account JSON: %w", err)
	}

	if strings.TrimSpace(account.Username) == "" || strings.TrimSpace(account.Password) == "" || strings.TrimSpace(account.SubDomain) == "" {
		return goacmedns.Account{}, errors.New("acme-dns: single-account credentials require username, password, and subdomain")
	}

	return account, nil
}

func newStorageBackedProvider(serverURL, credentials string) (challenge.Provider, error) {
	tempFilePath, err := createTempCredentialsFile(credentials)
	if err != nil {
		return nil, err
	}

	providerConfig := legoacmedns.NewDefaultConfig()
	providerConfig.APIBase = serverURL
	providerConfig.StoragePath = tempFilePath

	return legoacmedns.NewDNSProviderConfig(providerConfig)
}
