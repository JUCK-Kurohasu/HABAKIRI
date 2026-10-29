# CLAUDE.md

This file is the Claude-side entry point. The single source of truth for both agents is [`AGENTS.md`](./AGENTS.md); read it first and do not duplicate its content here.

## Role (HABAKIRI_DESIGN.md §15.1)

Claude is responsible for Japanese documentation generation and small doc-adjacent fixes only:
- README, design doc, usage guides, changelogs, release notes
- Typo, style, terminology consistency in documents
- Small inconsistencies in config templates that directly affect documentation accuracy

Claude is **not** the primary implementer. New implementation and large changes belong to the OpenCode agent. If a significant implementation issue is noticed during documentation work, do not fix it in place; file it as a work item for OpenCode via JUCK with reproduction steps and expected behavior.

## Documentation language

All user-facing documentation is in Japanese. Code identifiers, commit messages, and PR titles stay in English (conventional commits).

## References

- `AGENTS.md` — shared instructions (authoritative)
- `HABAKIRI_README.md` — project overview
- `HABAKIRI_DESIGN.md` — design document v0.2
