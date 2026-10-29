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

`make dev` は `bun run --env-file=.env` で `.env` を読み込みます。ただし TUI が接続するバックグラウンドサービスは**起動時の環境変数しか見ない**ため、API キーを変更したら `make restart` を実行してください（詳細は下の「トラブルシューティング」）。

## トラブルシューティング

### モデルが BigPickle になる
設定した `model`（`orcarouter/orca/orcacyber-zero-1.5`）が有効な設定ファイルに無いと、OpenCode 既定の BigPickle にフォールバックします。

| 確認 | 対処 |
|---|---|
| `opencode.json` がリポジトリ直下にあるか（`.gitignore` 対象のため clone 直後は無い） | `make setup`。`make dev` も警告を出します |
| 起動後に `.env` を変えたのに反映されない | `make restart`（サービスの再起動） |
| グローバル設定で使いたい | 下記 |

`packages/cli/` に `opencode.json` をコピーする必要はありません。設定は起動ディレクトリから親方向に探索されるため、リポジトリ直下のファイルが読まれます。

### グローバル設定（どのディレクトリでも OrcaRouter を使う）
`opencode.json.example` を `~/.config/opencode/opencode.json`（`XDG_CONFIG_HOME` 設定時はその配下の `opencode/`）にコピーします。API キーはバックグラウンドサービスの環境変数として登録します。

```bash
mkdir -p ~/.config/opencode
cp opencode.json.example ~/.config/opencode/opencode.json
bun run dev service set env ORCAROUTER_API_KEY "<your-key>"
```

キーは `~/.config/opencode/service-local.json` に平文で保存されます（コミット対象外ですが、取り扱いに注意）。`service set env` はサービスを停止するので、次回の `make dev` で新しい値で起動します。

## ドキュメント
- [HABAKIRI_DESIGN.md](./HABAKIRI_DESIGN.md) — 改造ポイント設計書
- [docs/habakiri/model-resolution.md](./docs/habakiri/model-resolution.md) — モデル解決とグローバル設定の調査メモ
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