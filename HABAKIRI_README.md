# HABAKIRI

```
██╗  ██╗ █████╗ ██████╗  █████╗ ██╗  ██╗██╗██████╗ ██╗
██║  ██║██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║██╔══██╗██║
███████║███████║██████╗ ██║  ██║█████╔╝ ██║██████╔╝██║
██╔══██║██╔══██║██╔═══╝ ██║  ██║██╔═██╗ ██║██╔══██╗██║
██║  ██║██║  ██║███████╗╚█████╔╝██║  ██╗██║██║  ██║██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝
```

**HABAKIRI**（「羽々斬」に由来）は、OrcaRouter のモデル群を 0day / 脆弱性探索と PoC 開発に特化させるためのコーディングエージェントである。[OpenCode](https://github.com/anomalyco/opencode)（anomalyco/opencode、MIT License）をフォークし、タスクの局面（トリアージ / 監査 / Exploit 化 / 検証）に応じたモデル自動選択、バイナリ解析ツールの連携、PoC の自動検証ループを備えることを目指す。

現在は設計フェーズを終え、Phase 1（MVP）と Phase 2（TUI 特化レンダラ、findings-compactor、回帰ハーネス）の実装が完了している。Phase 0（OrcaRouter のモデル ID・tool calling 実証）は API キー未取得のため保留中。

## ドキュメント

- [DESIGN.md](./DESIGN.md) — 改造ポイント設計書 v0.2
  - ベースバージョン決定（上流タグ `v1.19.5` からフォーク）
  - 改造ポイント一覧 M-01〜M-14（P0 は設定と新規プラグインのみで、上流コア改変なし）
  - モデル役割分担（DeepSeek Abliterated = トリアージ / OrcaCyber Zero 1.5 = 監査・実装 / OrcaCyber Ultra 1.0 = Exploit・検証）
  - セキュリティ設計（外部送信ガード、PoC 実行サンドボックス、プロンプトインジェクション対策）
  - 実装フェーズ計画（Phase 0: OrcaRouter 側の前提検証を関門とする）
  - 開発体制と役割分担（設計書 §15）

## 開発体制

| 担当 | 役割 |
|---|---|
| OpenCode | 主開発（フォーク本体の実装、テスト） |
| Claude | 日本語ドキュメントの生成と、ドキュメントを中心とする細かな修正 |

詳細と線引きの原則は設計書 §15 を参照すること。

## ステータス

- 2026-10-28: プロジェクト名称を HABAKIRI に確定。設計書 v0.2 を作成。
- 2026-10-29: Phase 1 MVP 完了（カスタムツール 4 種、egress-guard、orca-router、スラッシュコマンド）。
- 2026-10-29: Phase 2 完了（findings-compactor、TUI 特化レンダラ M-10、回帰ハーネス）。
- 次の段階: Phase 0（OrcaRouter 実証、API キー取得待ち）および Phase 3。

## 立ち上げ方法

### 前提
- Bun 1.4.4 以上（`bun --version`）
- 依存関係: `bun install --ignore-scripts`

### セットアップ
```bash
# Unix / Kali / WSL
make setup

# Windows (PowerShell)
Copy-Item .env.example .env
Copy-Item opencode.json.example opencode.json
```
`.env` に `ORCAROUTER_API_KEY` を、`opencode.json` の `__MODEL_ID_*__` を実モデル ID に置換する。

### 起動
```bash
# Windows
bun run dev          # CLI (TUI)
bun run dev:web      # Web アプリ

# Unix / Kali / WSL
make dev
make dev-web
```
Bun は `.env` を自動ロードするため、環境変数の export は不要。

### ビルド
```bash
bun run build        # → packages/opencode/bin/opencode
```

### 型チェック / テスト
```bash
cd packages/opencode && bun run typecheck
cd packages/session-ui && bun run typecheck
```

## ライセンスと関係性について

- 上流の OpenCode は MIT License であり、本プロジェクトはそのフォークである。本プロジェクト自体のライセンスは設計書 §12 の方針に従い、公開時に本ファイルへ明記する。
- 本プロジェクトは OpenCode チームによる製品ではなく、提携関係もない。また、OrcaRouter 公式の製品でもない。
