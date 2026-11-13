package report

import "testing"

func TestSMTPAuthUsername(t *testing.T) {
	tests := []struct {
		name     string
		username string
		sender   string
		want     string
	}{
		{name: "configured username", username: "smtp-login", sender: "sender@example.test", want: "smtp-login"},
		{name: "legacy config falls back to sender", sender: "sender@example.test", want: "sender@example.test"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := smtpAuthUsername(tt.username, tt.sender); got != tt.want {
				t.Fatalf("smtpAuthUsername(%q, %q) = %q, want %q", tt.username, tt.sender, got, tt.want)
			}
		})
	}
}
