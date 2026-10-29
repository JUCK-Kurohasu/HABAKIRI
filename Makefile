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
	bun run --env-file=.env dev

dev-web:
	bun run dev:web

build:
	bun run --cwd packages/cli build

typecheck:
	bun run typecheck

setup:
	@bash scripts/setup.sh

clean:
	rm -rf eval/challenges/bin eval/challenges/flag.txt .habakiri
