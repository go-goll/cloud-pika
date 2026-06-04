package config

import (
	"flag"
	"os"
)

// Config 定义 sidecar 服务运行配置。
type Config struct {
	Host      string
	Port      int
	Token     string
	DBPath    string
	MasterKey string
}

// Load 从 flag 与环境变量加载配置。
func Load() Config {
	cfg := Config{}

	flag.StringVar(&cfg.Host, "host", "127.0.0.1", "sidecar bind host")
	flag.IntVar(&cfg.Port, "port", 8787, "sidecar bind port")
	flag.StringVar(&cfg.Token, "token", "dev-token", "api bearer token")
	flag.StringVar(&cfg.DBPath, "db", "cloud-pika.sqlite", "sqlite db path")
	flag.Parse()

	cfg.MasterKey = os.Getenv("CLOUD_PIKA_MASTER_KEY")
	if cfg.MasterKey == "" {
		cfg.MasterKey = "cloud-pika-default-master-key"
	}

	return cfg
}
