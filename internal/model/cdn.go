package model

// CDNQuota CDN 刷新/预热每日配额。
type CDNQuota struct {
	URLRefreshRemain int `json:"urlRefreshRemain"`
	URLRefreshLimit  int `json:"urlRefreshLimit"`
	DirRefreshRemain int `json:"dirRefreshRemain"`
	DirRefreshLimit  int `json:"dirRefreshLimit"`
	PrefetchRemain   int `json:"prefetchRemain"`
	PrefetchLimit    int `json:"prefetchLimit"`
}
