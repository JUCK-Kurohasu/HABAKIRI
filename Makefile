.PHONY: help dev dev-web build typecheck setup restart check clean

help:
	@echo "HABAKIRI make targets:"
	@echo "  make dev        - start OpenCode CLI (TUI) dev server"
	@echo "  make dev-web    - start web app dev server"
	@echo "  make build      - build opencode binary"
	@echo "  make typecheck  - run typecheck across packages"
	@echo "  make setup      - copy opencode.json.example -> opencode.json"
	@echo "  make restart    - restart background service with .env (use after changing the API key)"
	@echo "  make check      - warn about missing opencode.json / API key"
	@echo "  make clean      - remove eval artifacts"

dev: check
	bun run --env-file=.env dev

dev-web:
	bun run dev:web

build:
	bun run --cwd packages/cli build

typecheck:
	bun run typecheck

setup:
	@bash scripts/setup.sh

# The TUI talks to a long-lived background service that reads {env:ORCAROUTER_API_KEY}
# from its own environment at start-up. `make dev` does not restart it, so a changed
# .env only takes effect after this target (see docs/habakiri/model-resolution.md).
restart:
	bun run --env-file=.env dev service restart

# Warnings only: a global ~/.config/opencode/opencode.json is also a valid setup.
check:
	@test -f opencode.json || echo "WARN: opencode.json not found. Run 'make setup', otherwise the default model (BigPickle) is used."
	@grep -Eq '^ORCAROUTER_API_KEY=.+' .env 2>/dev/null && ! grep -q 'sk-your-key-here' .env || echo "WARN: ORCAROUTER_API_KEY is missing or still the placeholder in .env."

clean:
	rm -rf eval/challenges/bin eval/challenges/flag.txt .habakiri
