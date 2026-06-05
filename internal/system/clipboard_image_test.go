package system

import (
	"os"
	"testing"
)

func TestWriteImageToTemp(t *testing.T) {
	dir := t.TempDir()
	path, err := writeImageToTemp(dir, 123, []byte("PNGDATA"))
	if err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(path)
	if string(got) != "PNGDATA" {
		t.Fatalf("content = %q, want PNGDATA", got)
	}
}
