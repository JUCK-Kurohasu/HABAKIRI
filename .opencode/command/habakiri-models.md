---
description: List available OrcaRouter models and show how to change agent-to-model assignment
agent: audit
subtask: true
---

List the OrcaRouter models available for HABAKIRI and explain how to change the agent-to-model mapping.

## Current assignment (opencode.json / orca-router.yaml)
- triage: orca/orcacyber-flash-1.0 (DeepSeek V4.1 Flash Abliterated)
- audit: orca/orcacyber-zero-1.5 (OrcaCyber Zero 1.5)
- exploit / verify: orca/orcacyber-ultra-1.0 (OrcaCyber Ultra 1.0)

## Free alternatives (from GET /v1/models)
- orca/orcacyber-minimax-m3.1-flash-free (MiniMax M3.1 Flash Abliterated, free)
- orca/orcacyber-glm-5.3-flash-free (GLM 5.3 Flash Abliterated, free)
- orca/orcacyber-mimo-flash (MiMo V2.6 Flash Abliterated, free)
- tencent/hy4-preview-free, tencent/hy3-free, z-ai/glm-5.3-flash-free

## How to change
1. Edit `opencode.json`: change `agent.<name>.model` to `orcarouter/<model-id>`
2. Edit `orca-router.yaml`: change `phases.<phase>.model` and `prices_usd_per_mtok`
3. Edit `.opencode/agent/<name>.md`: change the `model:` frontmatter field

Restart OpenCode after changes. Interactive settings UI is planned for Phase 3.
