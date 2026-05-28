.PHONY: help install install-backend install-frontend \
        dev dev-backend dev-frontend \
        test test-backend test-frontend \
        ios android clean

# Default target
help:
	@echo "CSA Market — available targets:"
	@echo ""
	@echo "  make install          Install all dependencies (backend + frontend)"
	@echo "  make dev              Start backend and frontend concurrently"
	@echo "  make dev-backend      Start backend only (nodemon)"
	@echo "  make dev-frontend     Start Expo dev server only"
	@echo "  make ios              Start Expo targeting iOS simulator"
	@echo "  make android          Start Expo targeting Android emulator"
	@echo "  make test             Run all tests (backend + frontend)"
	@echo "  make test-backend     Run backend Jest tests"
	@echo "  make test-frontend    Run frontend Jest tests"
	@echo "  make clean            Remove all node_modules"

# ── Install ─────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	cd backend && npm install

install-frontend:
	cd frontend && npm install

# ── Dev servers ─────────────────────────────────────────────────────────────

dev:
	@command -v concurrently >/dev/null 2>&1 || npm install -g concurrently
	concurrently --names "backend,frontend" --prefix-colors "blue,green" \
		"cd backend && npm run dev" \
		"cd frontend && npx expo start"

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npx expo start

ios:
	cd frontend && npx expo start --ios

android:
	cd frontend && npx expo start --android

# ── Tests ────────────────────────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

# ── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	rm -rf backend/node_modules frontend/node_modules
