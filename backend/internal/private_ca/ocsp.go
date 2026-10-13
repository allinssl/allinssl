package private_ca

import (
	"crypto"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ocsp"
)

// HandleOCSP 处理 OCSP 请求（GET/POST），无需登录。
// GET:  /v1/private_ca/public/ocsp/<base64url-der>
// POST: body 为 DER 编码的 OCSPRequest
func HandleOCSP(c *gin.Context) {
	var reqDER []byte
	var err error

	switch c.Request.Method {
	case http.MethodPost:
		reqDER, err = io.ReadAll(io.LimitReader(c.Request.Body, 1<<20))
		if err != nil {
			c.Data(http.StatusBadRequest, "application/ocsp-response", ocsp.InternalErrorErrorResponse)
			return
		}
	case http.MethodGet:
		raw := c.Param("payload")
		raw = strings.TrimPrefix(raw, "/")
		if raw == "" {
			raw = c.Query("b64")
		}
		if raw == "" {
			c.Data(http.StatusBadRequest, "application/ocsp-response", ocsp.MalformedRequestErrorResponse)
			return
		}
		reqDER, err = decodeOCSPPayload(raw)
		if err != nil {
			c.Data(http.StatusBadRequest, "application/ocsp-response", ocsp.MalformedRequestErrorResponse)
			return
		}
	default:
		c.Status(http.StatusMethodNotAllowed)
		return
	}

	respDER, err := BuildOCSPResponse(reqDER)
	if err != nil {
		c.Data(http.StatusOK, "application/ocsp-response", ocsp.InternalErrorErrorResponse)
		return
	}
	c.Header("Cache-Control", "max-age=3600")
	c.Data(http.StatusOK, "application/ocsp-response", respDER)
}

func decodeOCSPPayload(raw string) ([]byte, error) {
	raw = strings.ReplaceAll(raw, "%2B", "+")
	raw = strings.ReplaceAll(raw, "%2F", "/")
	raw = strings.ReplaceAll(raw, "%3D", "=")
	raw = strings.ReplaceAll(raw, "%2b", "+")
	raw = strings.ReplaceAll(raw, "%2f", "/")
	raw = strings.ReplaceAll(raw, "%3d", "=")
	// base64url → base64
	raw = strings.ReplaceAll(raw, "-", "+")
	raw = strings.ReplaceAll(raw, "_", "/")
	for len(raw)%4 != 0 {
		raw += "="
	}
	return base64.StdEncoding.DecodeString(raw)
}

// BuildOCSPResponse 根据 DER 请求生成签名的 OCSP 响应。
func BuildOCSPResponse(reqDER []byte) ([]byte, error) {
	req, err := ocsp.ParseRequest(reqDER)
	if err != nil {
		return ocsp.MalformedRequestErrorResponse, nil
	}
	if req.SerialNumber == nil {
		return ocsp.MalformedRequestErrorResponse, nil
	}

	leaf, caRow, err := findLeafBySerial(req.SerialNumber)
	if err != nil || leaf == nil || caRow == nil {
		return ocsp.UnauthorizedErrorResponse, nil
	}

	algorithm, _ := caRow["algorithm"].(string)
	if algorithm == "sm2" {
		return ocsp.InternalErrorErrorResponse, nil
	}

	issuerObj, err := NewCertificateFromPEMStandard(
		[]byte(fmt.Sprint(caRow["cert"])),
		[]byte(fmt.Sprint(caRow["key"])),
		KeyType(algorithm),
	)
	if err != nil || issuerObj.Cert == nil {
		return ocsp.InternalErrorErrorResponse, nil
	}
	signer, ok := issuerObj.Key.(crypto.Signer)
	if !ok {
		return ocsp.InternalErrorErrorResponse, nil
	}

	status := ocsp.Good
	var revokedAt time.Time
	reason := 0
	if st, _ := leaf["status"].(string); st == LeafStatusRevoked {
		status = ocsp.Revoked
		revokedAt = time.Now()
		if v, ok := leaf["revoked_at"].(string); ok && v != "" {
			if t, e := time.Parse("2006-01-02 15:04:05", v); e == nil {
				revokedAt = t
			}
		}
		reason = parseRevokeReasonCode(leaf["revoke_reason"])
		if reason < 0 {
			reason = 0
		}
	}

	now := time.Now()
	template := ocsp.Response{
		Status:           status,
		SerialNumber:     req.SerialNumber,
		ThisUpdate:       now.Add(-time.Minute),
		NextUpdate:       now.Add(1 * time.Hour),
		RevokedAt:        revokedAt,
		RevocationReason: reason,
		Certificate:      issuerObj.Cert,
	}

	return ocsp.CreateResponse(issuerObj.Cert, issuerObj.Cert, template, signer)
}

func findLeafBySerial(serial *big.Int) (leaf map[string]any, ca map[string]any, err error) {
	if serial == nil {
		return nil, nil, fmt.Errorf("nil serial")
	}
	s, err := GetSqlite()
	if err != nil {
		return nil, nil, err
	}
	defer s.Close()
	s.TableName = "leaf"

	hexSN := strings.ToLower(hex.EncodeToString(serial.Bytes()))
	hexSN = strings.TrimLeft(hexSN, "0")
	if hexSN == "" {
		hexSN = "0"
	}
	decSN := serial.String()

	rows, err := s.Where("lower(serial_number)=? or serial_number=? or serial_number=?", []interface{}{hexSN, hexSN, decSN}).Select()
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		all, err := s.Where("1=1", []interface{}{}).Select()
		if err != nil {
			return nil, nil, err
		}
		for _, r := range all {
			sn, e := resolveLeafSerial(r)
			if e != nil || sn == nil {
				continue
			}
			if sn.Cmp(serial) == 0 {
				rows = []map[string]any{r}
				break
			}
		}
	}
	if len(rows) == 0 {
		return nil, nil, fmt.Errorf("leaf not found")
	}
	leaf = rows[0]
	caId, ok := toInt64(leaf["ca_id"])
	if !ok {
		return leaf, nil, fmt.Errorf("bad ca_id")
	}
	s.TableName = "ca"
	cas, err := s.Where("id=?", []interface{}{caId}).Select()
	if err != nil || len(cas) == 0 {
		return leaf, nil, fmt.Errorf("ca not found")
	}
	return leaf, cas[0], nil
}

func toInt64(v any) (int64, bool) {
	switch t := v.(type) {
	case int64:
		return t, true
	case int:
		return int64(t), true
	case float64:
		return int64(t), true
	case string:
		var n int64
		_, err := fmt.Sscan(t, &n)
		return n, err == nil
	default:
		return 0, false
	}
}
