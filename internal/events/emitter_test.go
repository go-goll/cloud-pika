package events

import "testing"

// fakeEmitter 记录收到的事件，验证 WailsPublisher 正确转发。
type fakeEmitter struct {
	name string
	data any
}

func (f *fakeEmitter) Emit(name string, data ...any) bool {
	f.name = name
	if len(data) > 0 {
		f.data = data[0]
	}
	return true
}

func TestWailsPublisher_Publish(t *testing.T) {
	fake := &fakeEmitter{}
	pub := NewWailsPublisher(fake)
	pub.Publish("transfer.progress", map[string]any{"id": "x"})
	if fake.name != "transfer.progress" {
		t.Fatalf("event name = %q, want transfer.progress", fake.name)
	}
	if fake.data == nil {
		t.Fatal("data not forwarded")
	}
}
