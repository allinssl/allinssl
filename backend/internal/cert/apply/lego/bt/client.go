package bt

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// 生成 API 签名
func (c *Config) generateSignature(method, path string, body string) (string, string) {
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	signingString := fmt.Sprintf("%s\n%s\n%s\n%s\n%s",
		c.AccountID,
		timestamp,
		strings.ToUpper(method),
		path,
		body,
	)

	h := hmac.New(sha256.New, []byte(c.SecretKey))
	h.Write([]byte(signingString))
	signature := hex.EncodeToString(h.Sum(nil))

	return timestamp, signature
}

// 发起 API 请求
func (c *Config) MakeRequest(method, path string, data interface{}) (map[string]interface{}, error) {
	url := strings.TrimRight(c.BaseURL, "/") + path

	var bodyStr string
	var bodyBytes []byte
	if data != nil {
		b, err := json.Marshal(data)
		if err != nil {
			return nil, err
		}
		bodyStr = string(b)
		bodyBytes = b
	}

	timestamp, signature := c.generateSignature(method, path, bodyStr)

	req, err := http.NewRequest(method, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Account-ID", c.AccountID)
	req.Header.Set("X-Access-Key", c.AccessKey)
	req.Header.Set("X-Timestamp", timestamp)
	req.Header.Set("X-Signature", signature)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return nil, err
	}

	return result, nil
}
