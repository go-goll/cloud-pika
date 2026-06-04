package model

import "errors"

// ErrNotSupported 表示当前 Provider 不支持该操作。
var ErrNotSupported = errors.New("operation not supported by this provider")
