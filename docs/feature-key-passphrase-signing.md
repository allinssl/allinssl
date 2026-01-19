# Feature: Key passphrase signing for CA

This feature adds server-side utilities to support decrypting password-protected private keys (PEM) when signing certificates.

Highlights:

- New utilities: backend/internal/private_ca/crypto.go (AES-GCM encrypt/decrypt using ALLINSSL_MASTER_KEY)
- Import logic: backend/internal/private_ca/import.go (validate imported root CA and re-encrypt private key for storage)
- Signing with passphrase: backend/internal/private_ca/with_pass.go exposes CreateLeafCertWithPass to allow passing `key_pass` for encrypted PEMs
- API: backend/app/api/private_ca/private_ca_pass.go adds CreateLeafCert handler accepting `key_pass`
- Tests: simple unit tests for crypto and import error path

Usage / Deployment notes:

- Set environment variable ALLINSSL_MASTER_KEY to a 32-byte key (recommended: store in CI/Secrets manager / KMS)
- The code currently includes TODOs for integrating persistent storage for imported CA records; please implement saveImportedCARecord using the project's DB helper (GetSqlite)
- Front-end: the UI should pass `key_pass` when calling CreateLeafCert if the CA's private key is password-protected.

Security:

- Do NOT store plaintext private keys in DB or logs. Use KMS in production.
- The master key must be protected; rotate as necessary.
