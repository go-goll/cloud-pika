package crypto

import "testing"

func TestEncryptDecrypt(t *testing.T) {
	svc := NewService("unit-test-key")
	plain := "secret-value-123"

	encrypted, err := svc.Encrypt(plain)
	if err != nil {
		t.Fatalf("encrypt failed: %v", err)
	}
	if encrypted == plain {
		t.Fatalf("encrypted value should differ from plain text")
	}

	decrypted, err := svc.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("decrypt failed: %v", err)
	}
	if decrypted != plain {
		t.Fatalf("unexpected decrypted value: %s", decrypted)
	}
}
