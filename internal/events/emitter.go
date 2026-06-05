package events

// emitter 抽象 Wails 应用的事件发射能力，便于测试替身。
// *application.EventManager（即 app.Event）满足该接口：Emit(name string, data ...any) bool。
type emitter interface {
	Emit(name string, data ...any) bool
}

// WailsPublisher 把 queue 的事件转发为 Wails 前端事件，
// 实现 queue 的 publisher 接口（Publish(event string, payload any)）。
type WailsPublisher struct {
	app emitter
}

// NewWailsPublisher 基于 Wails 事件发射器构建 publisher。
func NewWailsPublisher(app emitter) *WailsPublisher {
	return &WailsPublisher{app: app}
}

// Publish 将队列事件原样转发到 Wails 事件总线。
func (p *WailsPublisher) Publish(event string, payload any) {
	p.app.Emit(event, payload)
}
