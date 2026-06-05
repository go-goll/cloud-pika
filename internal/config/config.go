package config

// Config 定义应用运行配置。Wails 单进程下仅需密钥加密主密钥；
// 主密钥的来源（环境变量/默认值）由调用方（main.go resolveMasterKey）决定。
type Config struct {
	MasterKey string // 密钥加密主密钥
}
