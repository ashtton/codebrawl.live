package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
)

type AuthMessage struct {
	Type   string `json:"type"`
	UserID string `json:"userId"`
	Token  string `json:"token"`
}

type VerifyResult struct {
	UserID    string
	Subject   string
	Issuer    string
	ExpiresAt time.Time
	Username  string
	ImageURL  string
}

func VerifyClerkJWT(ctx context.Context, tokenStr string) (*VerifyResult, error) {
	issuer := strings.TrimSuffix(os.Getenv("CLERK_ISSUER"), "/")
	if issuer == "" {
		return nil, errors.New("CLERK_ISSUER not set")
	}
	jwksURL := os.Getenv("CLERK_JWKS_URL")
	if jwksURL == "" {
		jwksURL = issuer + "/.well-known/jwks.json"
	}

	tok, _, err := new(jwt.Parser).ParseUnverified(tokenStr, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("parse token header: %w", err)
	}
	kid, _ := tok.Header["kid"].(string)
	if kid == "" {
		return nil, errors.New("token missing kid")
	}

	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("fetch jwks: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("jwks http %d", resp.StatusCode)
	}
	var jwks struct {
		Keys []struct {
			Kty string `json:"kty"`
			Kid string `json:"kid"`
			N   string `json:"n"`
			E   string `json:"e"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("decode jwks: %w", err)
	}
	var pubKey *rsa.PublicKey
	for _, k := range jwks.Keys {
		if k.Kid == kid && k.Kty == "RSA" {
			// Convert base64url n and e to rsa.PublicKey
			nb, err := base64URLDecode(k.N)
			if err != nil {
				return nil, fmt.Errorf("bad n: %w", err)
			}
			eb, err := base64URLDecode(k.E)
			if err != nil {
				return nil, fmt.Errorf("bad e: %w", err)
			}
			pubKey = &rsa.PublicKey{N: bytesToBigInt(nb), E: bytesToInt(eb)}
			break
		}
	}
	if pubKey == nil {
		return nil, errors.New("matching jwk not found")
	}

	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return pubKey, nil
	})
	if err != nil || !parsed.Valid {
		return nil, fmt.Errorf("invalid jwt: %w", err)
	}

	if iss, _ := claims["iss"].(string); iss != issuer {
		return nil, errors.New("issuer mismatch")
	}
	if sub, _ := claims["sub"].(string); sub == "" {
		return nil, errors.New("missing sub")
	}
	var expTime time.Time
	if exp, ok := claims["exp"].(float64); ok {
		expTime = time.Unix(int64(exp), 0)
	}

	return &VerifyResult{
		UserID:    stringOr(claims["sub"]),
		Subject:   stringOr(claims["sub"]),
		Issuer:    stringOr(claims["iss"]),
		ExpiresAt: expTime,
		Username:  stringOr(claims["username"]),
		ImageURL:  stringOr(claims["imageUrl"]),
	}, nil
}

func ParseAndVerifyAuthMessage(ctx context.Context, payload []byte) (*VerifyResult, error) {
	var msg AuthMessage
	if err := json.Unmarshal(payload, &msg); err != nil {
		return nil, fmt.Errorf("invalid json: %w", err)
	}
	if msg.Type != "auth" {
		return nil, errors.New("unexpected message type")
	}
	if msg.Token == "" {
		return nil, errors.New("missing token")
	}
	res, err := VerifyClerkJWT(ctx, msg.Token)
	if err != nil {
		return nil, err
	}
	// optional: ensure provided userId matches token sub
	if msg.UserID != "" && msg.UserID != res.Subject {
		return nil, errors.New("userId mismatch")
	}
	return res, nil
}

func base64URLDecode(s string) ([]byte, error) {
	s = strings.ReplaceAll(s, "-", "+")
	s = strings.ReplaceAll(s, "_", "/")
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.StdEncoding.DecodeString(s)
}

func bytesToBigInt(b []byte) *big.Int { var z big.Int; return z.SetBytes(b) }
func bytesToInt(b []byte) int {
	v := 0
	for _, by := range b {
		v = v<<8 | int(by)
	}
	return v
}

func stringOr(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
