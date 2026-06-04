package core

import (
	"database/sql"

	"github.com/goll/cloud-pika/internal/config"
	"github.com/goll/cloud-pika/internal/crypto"
	"github.com/goll/cloud-pika/internal/database"
	"github.com/goll/cloud-pika/internal/queue"
	"github.com/goll/cloud-pika/internal/storage"
)

// Deps 聚合所有绑定服务共享的依赖，统一注入避免构造参数膨胀。
type Deps struct {
	Cfg       config.Config           // 运行配置（含 MasterKey）
	Encryptor crypto.Service          // 密钥加解密
	Accounts  database.AccountStore   // 账号存储
	Settings  database.SettingsStore  // 应用设置存储
	Transfers database.TransferStore  // 传输任务存储
	Queue     *queue.Manager          // 传输队列
	Providers storage.ProviderFactory // 云存储 provider 工厂
}

// NewDeps 基于数据库连接与队列构建依赖容器。
func NewDeps(cfg config.Config, db *sql.DB, q *queue.Manager) *Deps {
	return &Deps{
		Cfg:       cfg,
		Encryptor: crypto.NewService(cfg.MasterKey),
		Accounts:  database.NewAccountStore(db),
		Settings:  database.NewSettingsStore(db),
		Transfers: database.NewTransferStore(db),
		Queue:     q,
		Providers: storage.NewFactory(),
	}
}
