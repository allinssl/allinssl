package private_ca

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
)

// saveImportedCARecord is a placeholder that should use the project's DB layer to persist the imported CA record.
// It must be implemented to match existing DB schema (table ca) and fields.
func saveImportedCARecord(name, certPEM string, encryptedKey, iv []byte, algo, protectedBy string) error {
	// TODO: implement persistence using GetSqlite() and insert into ca table with fields:
	// name, cert, encrypted_key, key_iv, key_enc_algo, key_protected_by, source='imported', create_time
	return nil
}

// ImportRootCA: validate cert/key pair and store encrypted private key
func ImportRootCA(name, certPEM, keyPEM, keyPass, protectWith string) error {
	// parse cert
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		return errors.New("invalid cert pem")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return err
	}

	// parse key (support traditional PEM encrypted block)
	keyBlock, _ := pem.Decode([]byte(keyPEM))
	if keyBlock == nil {
		return errors.New("invalid key pem")
	}

	var privDER []byte
	if x509.IsEncryptedPEMBlock(keyBlock) {
		if keyPass == "" {
			return errors.New("private key is encrypted, passphrase required")
		}
		privDER, err = x509.DecryptPEMBlock(keyBlock, []byte(keyPass))
		if err != nil {
			return err
		}
	} else {
		// unencrypted PEM: use as-is
		privDER = keyBlock.Bytes
	}

	// verify key matches cert (basic check: try parse private key)
	if err := verifyPrivKeySupported(privDER); err != nil {
		return err
	}

	// re-encrypt private key with master key
	ciphertext, iv, err := EncryptWithMaster(privDER)
	if err != nil {
		return err
	}

	// TODO: save record to DB
	if err := saveImportedCARecord(name, certPEM, ciphertext, iv, "aes-gcm-256", protectWith); err != nil {
		return err
	}
	return nil
}

func verifyPrivKeySupported(der []byte) error {
	// try parse common private key encodings
	if _, err := x509.ParsePKCS1PrivateKey(der); err == nil {
		return nil
	}
	if _, err := x509.ParsePKCS8PrivateKey(der); err == nil {
		return nil
	}
	if _, err := x509.ParseECPrivateKey(der); err == nil {
		return nil
	}
	return errors.New("unsupported private key format")
}