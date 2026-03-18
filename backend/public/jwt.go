package public

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims JWT 声明
type Claims struct {
	Username string `json:"username"`
	UserID   int64  `json:"user_id,omitempty"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT token
func GenerateToken(username string, userID int64, expireSeconds int) (string, error) {
	if expireSeconds <= 0 {
		expireSeconds = JWTExpire
	}

	claims := Claims{
		Username: username,
		UserID:   userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expireSeconds) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "ALLinSSL",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(JWTSecret))
}

// ParseToken 解析 JWT token
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// RefreshToken 刷新 JWT token
func RefreshToken(tokenString string) (string, error) {
	claims, err := ParseToken(tokenString)
	if err != nil {
		return "", err
	}

	// 生成新的 token
	return GenerateToken(claims.Username, claims.UserID, JWTExpire)
}

// VerifyAPIKey 验证 API Key（用于生成 api_token）
func VerifyAPIKey(apiKey, apiToken, timestamp string) bool {
	if apiKey == "" || apiToken == "" || timestamp == "" {
		return false
	}

	expectedToken := GenerateAPIToken(apiKey, timestamp)
	if apiToken != expectedToken {
		return false
	}

	// 检查时间戳是否过期（5 分钟）
	ts, err := ParseTimestamp(timestamp)
	if err != nil {
		return false
	}

	if time.Now().Unix()-ts > 300 {
		return false
	}

	return true
}

// GenerateAPIToken 生成 API Token
func GenerateAPIToken(apiKey, timestamp string) string {
	return generateSignature(timestamp, apiKey)
}

// ParseTimestamp 解析时间戳
func ParseTimestamp(timestamp string) (int64, error) {
	return strconv.ParseInt(timestamp, 10, 64)
}

// generateSignature 生成 API 签名（内部使用）
func generateSignature(timestamp, apiKey string) string {
	keyMd5 := md5.Sum([]byte(apiKey))
	keyMd5Hex := strings.ToLower(hex.EncodeToString(keyMd5[:]))

	signMd5 := md5.Sum([]byte(timestamp + keyMd5Hex))
	signMd5Hex := strings.ToLower(hex.EncodeToString(signMd5[:]))
	return signMd5Hex
}
