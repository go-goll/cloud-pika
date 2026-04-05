package model

import "time"

// ProviderConfig 账户凭证配置。
type ProviderConfig struct {
	Provider    string `json:"provider"`
	Name        string `json:"name"`
	AccessKey   string `json:"accessKey"`
	SecretKey   string `json:"secretKey"`
	Endpoint    string `json:"endpoint,omitempty"`
	Region      string `json:"region,omitempty"`
	ServiceName string `json:"serviceName,omitempty"`
	Internal    bool   `json:"internal"`
	Paging      bool   `json:"paging"`
}

// Account 账户实体。
type Account struct {
	ID          string    `json:"id"`
	Provider    string    `json:"provider"`
	Name        string    `json:"name"`
	AccessKey   string    `json:"accessKey"`
	SecretKey   string    `json:"secretKey,omitempty"`
	Endpoint    string    `json:"endpoint,omitempty"`
	Region      string    `json:"region,omitempty"`
	ServiceName string    `json:"serviceName,omitempty"`
	Internal    bool      `json:"internal"`
	Paging      bool      `json:"paging"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// BucketInfo 存储桶元信息。
type BucketInfo struct {
	Name     string `json:"name"`
	Location string `json:"location,omitempty"`
	Provider string `json:"provider"`
}

// ObjectItem 对象条目。
type ObjectItem struct {
	Key          string `json:"key"`
	Size         int64  `json:"size"`
	MIMEType     string `json:"mimeType,omitempty"`
	ETag         string `json:"etag,omitempty"`
	LastModified string `json:"lastModified,omitempty"`
	IsDir        bool   `json:"isDir,omitempty"`
}

// ListParams 列表请求参数。
type ListParams struct {
	AccountID string `form:"accountId" json:"accountId"`
	Bucket    string `form:"bucket" json:"bucket"`
	Prefix    string `form:"prefix" json:"prefix"`
	Marker    string `form:"marker" json:"marker"`
	Limit     int    `form:"limit" json:"limit"`
	Delimiter string `form:"delimiter" json:"delimiter"`
}

// ListResult 对象列表返回结果。
type ListResult struct {
	Items     []ObjectItem `json:"items"`
	Marker    string       `json:"marker,omitempty"`
	Truncated bool         `json:"truncated"`
}

// UploadParams 上传参数。
type UploadParams struct {
	AccountID string `json:"accountId"`
	Bucket    string `json:"bucket"`
	Key       string `json:"key"`
	LocalPath string `json:"localPath,omitempty"`
	SourceURL string `json:"sourceUrl,omitempty"`
	Overwrite bool   `json:"overwrite"`
}

// DownloadParams 下载参数。
type DownloadParams struct {
	AccountID string `json:"accountId"`
	Bucket    string `json:"bucket"`
	Key       string `json:"key"`
	LocalPath string `json:"localPath"`
}

// RenameParams 重命名参数。
type RenameParams struct {
	AccountID string `json:"accountId"`
	Bucket    string `json:"bucket"`
	From      string `json:"from"`
	To        string `json:"to"`
}

// SignedURLParams 签名 URL 参数。
type SignedURLParams struct {
	AccountID       string `json:"accountId"`
	Bucket          string `json:"bucket"`
	Key             string `json:"key"`
	Domain          string `json:"domain,omitempty"`
	DeadlineSeconds int64  `json:"deadlineSeconds,omitempty"`
	HTTPS           bool   `json:"https"`
}

// TransferTask 表示上传/下载任务状态。
type TransferTask struct {
	ID           string    `json:"id"`
	Type         string    `json:"type"`
	Bucket       string    `json:"bucket"`
	Key          string    `json:"key"`
	Status       string    `json:"status"`
	Progress     int       `json:"progress"`
	ErrorMessage string    `json:"errorMessage,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// AppSettings 应用设置。
type AppSettings struct {
	Language         string `json:"language"`
	Theme            string `json:"theme"`
	HTTPS            bool   `json:"https"`
	HideDeleteButton bool   `json:"hideDeleteButton"`
	Paging           bool   `json:"paging"`
	CopyType         string `json:"copyType"`
}
