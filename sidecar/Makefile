BINARY_NAME=cloud-pika-sidecar
BIN_DIR=./bin
CACHE_DIR=./.cache

.PHONY: build build-mac build-windows test tidy clean

build:
	@mkdir -p $(BIN_DIR) $(CACHE_DIR)/go-build $(CACHE_DIR)/gomod
	GOCACHE=$(PWD)/.cache/go-build GOMODCACHE=$(PWD)/.cache/gomod \
		go build -o $(BIN_DIR)/$(BINARY_NAME) ./cmd/cloud-pika-sidecar

build-mac:
	@mkdir -p $(BIN_DIR)
	GOOS=darwin GOARCH=arm64 go build -o $(BIN_DIR)/$(BINARY_NAME)-darwin-arm64 ./cmd/cloud-pika-sidecar
	GOOS=darwin GOARCH=amd64 go build -o $(BIN_DIR)/$(BINARY_NAME)-darwin-amd64 ./cmd/cloud-pika-sidecar

build-windows:
	@mkdir -p $(BIN_DIR)
	GOOS=windows GOARCH=amd64 go build -o $(BIN_DIR)/$(BINARY_NAME)-windows-amd64.exe ./cmd/cloud-pika-sidecar
	GOOS=windows GOARCH=arm64 go build -o $(BIN_DIR)/$(BINARY_NAME)-windows-arm64.exe ./cmd/cloud-pika-sidecar

tidy:
	@mkdir -p $(CACHE_DIR)/go-build $(CACHE_DIR)/gomod
	GOCACHE=$(PWD)/.cache/go-build GOMODCACHE=$(PWD)/.cache/gomod \
		go mod tidy

test:
	@mkdir -p $(CACHE_DIR)/go-build $(CACHE_DIR)/gomod
	GOCACHE=$(PWD)/.cache/go-build GOMODCACHE=$(PWD)/.cache/gomod \
		go test ./...

clean:
	rm -rf $(BIN_DIR) $(CACHE_DIR)
