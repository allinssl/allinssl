package private_ca

import (
	"crypto"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"

	"github.com/tjfoc/gmsm/sm2"
	gmx509 "github.com/tjfoc/gmsm/x509"
)

func signCert(tmpl, parent *x509.Certificate, priv, parentPriv interface{}, keyType KeyType) (*Certificate, error) {
	certDER, err := x509.CreateCertificate(rand.Reader, tmpl, parent, priv.(crypto.Signer).Public(), parentPriv.(crypto.Signer))
	if err != nil {
		return nil, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	var keyPEM []byte

	switch k := priv.(type) {
	case *rsa.PrivateKey:
		keyPEM = pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(k)})
	case *ecdsa.PrivateKey:
		b, _ := x509.MarshalECPrivateKey(k)
		keyPEM = pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: b})
	}

	//tlsCert, _ := tls.X509KeyPair(certPEM, keyPEM)
	return &Certificate{CertPEM: certPEM, KeyPEM: keyPEM, KeyType: keyType}, nil
}

func signSM2Cert(tmpl, parent *gmx509.Certificate, priv, parentPriv *sm2.PrivateKey) (*Certificate, error) {
	certDER, err := gmx509.CreateCertificate(tmpl, parent, &priv.PublicKey, parentPriv)
	if err != nil {
		return nil, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	keyBytes, err := gmx509.MarshalSm2PrivateKey(priv, nil)
	if err != nil {
		return nil, err
	}

	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "SM2 PRIVATE KEY", Bytes: keyBytes})
	//tlsCert, _ := tls.X509KeyPair(certPEM, keyPEM)

	return &Certificate{
		CertPEM: certPEM,
		KeyPEM:  keyPEM,
		KeyType: KeySM2,
	}, nil
}
