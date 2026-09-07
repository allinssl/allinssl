package deploy

import (
	"encoding/json"
	"fmt"
	"testing"
)

func mustMarshalJSON(t *testing.T, value any) string {
	t.Helper()
	data, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	return string(data)
}

func TestParseSafeLineWafConfig(t *testing.T) {
	tests := []struct {
		name      string
		ignoreSSL any
		want      bool
	}{
		{name: "string one", ignoreSSL: "1", want: true},
		{name: "number one", ignoreSSL: 1, want: true},
		{name: "boolean true", ignoreSSL: true, want: true},
		{name: "string zero", ignoreSSL: "0", want: false},
		{name: "number zero", ignoreSSL: 0, want: false},
		{name: "boolean false", ignoreSSL: false, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			configJSON := fmt.Sprintf(
				`{"url":"https://waf.local:9443/","api_token":"token","ignore_ssl":%s,"port":22}`,
				mustMarshalJSON(t, tt.ignoreSSL),
			)

			config, err := parseSafeLineWafConfig(configJSON)
			if err != nil {
				t.Fatalf("parseSafeLineWafConfig() error = %v", err)
			}
			if config.URL != "https://waf.local:9443/" {
				t.Errorf("URL = %q, want %q", config.URL, "https://waf.local:9443/")
			}
			if config.APIToken != "token" {
				t.Errorf("APIToken = %q, want %q", config.APIToken, "token")
			}
			if config.IgnoreSSL != tt.want {
				t.Errorf("IgnoreSSL = %v, want %v", config.IgnoreSSL, tt.want)
			}
		})
	}
}
