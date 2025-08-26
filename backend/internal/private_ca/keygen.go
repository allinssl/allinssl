package private_ca

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"fmt"

	gm "github.com/tjfoc/gmsm/sm2"
)

func generatePrivateKey(keyType KeyType, keyBits int) (interface{}, error) {
	switch keyType {
	case KeyRSA:
		if keyBits == 0 {
			keyBits = 2048
		}
		return rsa.GenerateKey(rand.Reader, keyBits)
	case KeyECDSA:
		var c elliptic.Curve
		switch keyBits {
		case 224:
			c = elliptic.P224()
		case 256:
			c = elliptic.P256()
		case 384:
			c = elliptic.P384()
		case 521:
			c = elliptic.P521()
		default:
			c = elliptic.P384()
		}
		return ecdsa.GenerateKey(c, rand.Reader)
	case KeySM2:
		return gm.GenerateKey(rand.Reader)
	default:
		return nil, fmt.Errorf("unsupported key type: %s", keyType)
	}
}
