# HABAKIRI

```
██╗  ██╗ █████╗ ██████╗  █████╗ ██╗  ██╗██╗██████╗ ██╗
██║  ██║██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║██╔══██╗██║
███████║███████║██████╗ ██║  ██║█████╔╝ ██║██████╔╝██║
██╔══██║██╔══██║██╔═══╝ ██║  ██║██╔═██╗ ██║██╔══██╗██║
██║  ██║██║  ██║███████╗╚█████╔╝██║  ██╗██║██║  ██║██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝
```

**HABAKIRI**（「羽々斬」に由来）は、OrcaRouter のモデル群を 0day / 脆弱性探索と PoC 開発に特化させるコーディングエージェント。[OpenCode](https://github.com/anomalyco/opencode)（MIT License）のフォーク。

## セットアップ

### 前提
- Bun 1.4.4+ (`bun --version`)
- Node.js 20+ / Git

### 1. クローン & 依存関係
```bash
git clone https://github.com/JUCK-Kurohasu/HABAKIRI.git
cd HABAKIRI
bun install --ignore-scripts
```

### 2. 初期設定（API キー登録）
```bash
# Unix / Kali / WSL
make setup

# Windows (PowerShell)
.\scripts\setup.ps1
```
`make setup` / `setup.ps1` が OrcaRouter の API キーを対話入力で受け付け、`.env` と `opencode.json` を生成します。

### 3. 起動
```bash
# Windows
bun run dev          # CLI (TUI)
bun run dev:web      # Web アプリ

# Unix / Kali / WSL
make dev
make dev-web
```

Bun は `.env` を自動ロードします。API キーの export は不要です。

## ドキュメント
- [DESIGN.md](./DESIGN.md) — 改造ポイント設計書
- [AGENTS.md](./AGENTS.md) — 共通指示（開発者向け）

## 開発体制
| 担当 | 役割 |
|---|---|
| OpenCode | 主開発（フォーク本体の実装、テスト） |
| Claude | 日本語ドキュメント生成と細かな修正 |

## モデル割り当て（v2 マトリクス）

| 局面 | デフォルト | 代替（コスト最適化） | 無料フォールバック |
|---|---|---|---|
| triage | `orca/orcacyber-hy4` ($0.80/$1.60, Q9) | `orca/orcacyber-flash-1.0` ($0.80/$1.60, Q8) | `orca/orcacyber-minimax-m3.1-flash-free` (Q9) |
| audit | `orca/orcacyber-zero-1.5` ($3.00/$7.50, Q9) | `orca/orcacyber-glm-5.3` ($3.00/$5.00, Q9) | `orca/orcacyber-glm-5.3-flash-free` (Q8) |
| exploit | `orca/orcacyber-ultra-1.0` ($5.00/$10.00, Q9) | — | — |
| verify | `orca/orcacyber-ultra-1.0` ($5.00/$10.00, Q9) | — | — |

変更方法: `opencode.json` の `agent.<name>.model` と `orca-router.yaml` の `phases.<phase>.model` を更新。`/habakiri-models` コマンドで一覧確認。

### 最新モデルの取り込み
汎用モデル（`openai/*`、`anthropic/*` など）はモデルカタログ経由で自動的に一覧へ出ます。カタログに無い `orca/*`（サイバー系）と `orcarouter/*` の別名だけは、`opencode.json` への登録が必要です。`/v1/models` から不足分を追加するスクリプトを用意しています（要 `ORCAROUTER_API_KEY` とネットワーク接続）。

```bash
bun run --env-file=.env scripts/sync-orca-models.ts           # 追加される ID の確認のみ（書き込まない）
make sync-models                                              # opencode.json に書き込み（Unix / WSL）
bun run --env-file=.env scripts/sync-orca-models.ts --write   # 同上（Windows）
```

- 既存のエントリは変更しません。書き込み時に `opencode.json` は整形し直されます。
- 追加されたエントリは `limit` 未設定のため、context 200000 / output 32000 の既定値になります。実際の上限に合わせて `limit` を書き足してください。
- カタログに既にある `orcarouter/auto` などが追加されることがありますが、害はありません。

## ライセンスと関係性
- 上流の OpenCode は MIT License。本プロジェクトはそのフォーク。
- OpenCode チームの製品ではなく、提携関係もない。OrcaRouter 公式の製品でもない。