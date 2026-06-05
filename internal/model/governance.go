package model

// LifecycleRule 生命周期规则。
type LifecycleRule struct {
	ID         string               `json:"id"`
	Prefix     string               `json:"prefix"`
	Enabled    bool                 `json:"enabled"`
	Expiration int                  `json:"expiration"` // 过期天数，0 表示不删除
	Transition *LifecycleTransition `json:"transition,omitempty"`
}

// LifecycleTransition 存储类型迁移规则。
type LifecycleTransition struct {
	Days         int    `json:"days"`
	StorageClass string `json:"storageClass"`
}

// CORSRule CORS 跨域规则。
type CORSRule struct {
	AllowedOrigins []string `json:"allowedOrigins"`
	AllowedMethods []string `json:"allowedMethods"`
	AllowedHeaders []string `json:"allowedHeaders"`
	ExposeHeaders  []string `json:"exposeHeaders,omitempty"`
	MaxAgeSeconds  int      `json:"maxAgeSeconds"`
}

// RefererConfig 防盗链配置。
type RefererConfig struct {
	Enabled    bool     `json:"enabled"`
	Type       string   `json:"type"` // "whitelist" | "blacklist"
	AllowEmpty bool     `json:"allowEmpty"`
	Referers   []string `json:"referers"`
}

// EncryptionConfig 服务端加密配置。
type EncryptionConfig struct {
	Enabled   bool   `json:"enabled"`
	Algorithm string `json:"algorithm"` // "AES256" | "aws:kms"
	KMSKeyID  string `json:"kmsKeyId,omitempty"`
}

// VersionListParams 版本列表查询参数。
type VersionListParams struct {
	AccountID     string `json:"accountId"`
	Bucket        string `json:"bucket"`
	Prefix        string `json:"prefix"`
	KeyMarker     string `json:"keyMarker"`
	VersionMarker string `json:"versionMarker"`
	Limit         int    `json:"limit"`
}

// VersionList 版本列表返回。
type VersionList struct {
	Versions          []ObjectVersion `json:"versions"`
	DeleteMarkers     []DeleteMarker  `json:"deleteMarkers,omitempty"`
	NextKeyMarker     string          `json:"nextKeyMarker,omitempty"`
	NextVersionMarker string          `json:"nextVersionMarker,omitempty"`
	Truncated         bool            `json:"truncated"`
}

// ObjectVersion 对象版本信息。
type ObjectVersion struct {
	Key          string `json:"key"`
	VersionID    string `json:"versionId"`
	IsLatest     bool   `json:"isLatest"`
	Size         int64  `json:"size"`
	LastModified string `json:"lastModified"`
	StorageClass string `json:"storageClass,omitempty"`
}

// DeleteMarker 删除标记。
type DeleteMarker struct {
	Key          string `json:"key"`
	VersionID    string `json:"versionId"`
	IsLatest     bool   `json:"isLatest"`
	LastModified string `json:"lastModified"`
}
