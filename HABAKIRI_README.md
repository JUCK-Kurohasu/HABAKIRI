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

## モデル割り当ての変更
エージェントごとのモデルは `opencode.json`（`agent.<name>.model`）と `orca-router.yaml`（`phases.<phase>.model`）で定義。利用可能なモデル一覧は `/habakiri-models` コマンドで確認。無料モデルへの切り替え例:

```json
// opencode.json
"agent": { "audit": { "model": "orcarouter/orca/orcacyber-minimax-m3.1-flash-free" } }
```

## ライセンスと関係性
- 上流の OpenCode は MIT License。本プロジェクトはそのフォーク。
- OpenCode チームの製品ではなく、提携関係もない。OrcaRouter 公式の製品でもない。