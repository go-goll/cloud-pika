PM := $(shell if command -v npm >/dev/null 2>&1; then echo npm; elif command -v pnpm >/dev/null 2>&1; then echo pnpm; elif command -v yarn >/dev/null 2>&1; then echo yarn; fi)

.PHONY: check-pm install dev build sidecar-build sidecar-build-windows sidecar-test

check-pm:
	@if [ -z "$(PM)" ]; then \
		echo "No package manager found. Please install npm, pnpm, or yarn."; \
		exit 1; \
	fi

install: check-pm
	$(PM) install

dev: check-pm sidecar-build
	@if [ ! -d node_modules ]; then \
		echo "node_modules not found, installing dependencies..."; \
		$(PM) install; \
	fi
	$(PM) run tauri:dev

build: check-pm sidecar-build
	@if [ ! -d node_modules ]; then \
		echo "node_modules not found, installing dependencies..."; \
		$(PM) install; \
	fi
	$(PM) run tauri:build

sidecar-build:
	$(MAKE) -C sidecar build
	mkdir -p src-tauri/binaries
	cp sidecar/bin/cloud-pika-sidecar src-tauri/binaries/cloud-pika-sidecar

sidecar-build-windows:
	$(MAKE) -C sidecar build-windows
	mkdir -p src-tauri/binaries
	cp sidecar/bin/cloud-pika-sidecar-windows-amd64.exe src-tauri/binaries/cloud-pika-sidecar.exe

sidecar-test:
	$(MAKE) -C sidecar test
