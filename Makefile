.PHONY: help dev dev-web build typecheck setup clean

help:
	@echo "HABAKIRI make targets:"
	@echo "  make dev        - start OpenCode CLI (TUI) dev server"
	@echo "  make dev-web    - start web app dev server"
	@echo "  make build      - build opencode binary"
	@echo "  make typecheck  - run typecheck across packages"
	@echo "  make setup      - copy opencode.json.example -> opencode.json"
	@echo "  make clean      - remove eval artifacts"

dev:
	bun run dev

dev-web:
	bun run dev:web

build:
	bun run --cwd packages/cli build

typecheck:
	bun run typecheck

setup:
	@if [ ! -f opencode.json ]; then cp opencode.json.example opencode.json && echo "created opencode.json (edit placeholders)"; else echo "opencode.json already exists"; fi
	@if [ ! -f .env ]; then cp .env.example .env && echo "created .env (set ORCAROUTER_API_KEY)"; else echo ".env already exists"; fi

clean:
	rm -rf eval/challenges/bin eval/challenges/flag.txt .habakiri
