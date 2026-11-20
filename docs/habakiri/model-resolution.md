# 作業メモ: モデルが BigPickle になる問題（OpenCode v2.2.1 ベース）

日付: 2026-10-29 / 担当: Claude（設定・ドキュメント範囲）

## 結論

| 仮説（エスカレーション時点） | 結果 |
|---|---|
| `--cwd packages/cli` のためルートの `opencode.json` が読まれない | **否定**。設定探索は起動ディレクトリから親方向に上る（`packages/core/src/config/discovery.ts` の `fs.up`）。`packages/cli` 起動でもルートの `opencode.json` が読まれ、`orcarouter/orca/orcacyber-zero-1.5` が既定になることを実機で確認 |
| `packages/cli/opencode.json` へのコピーが必要 | **不要**。二重管理になるだけなので行わない |
| `.env` が読まれていない | **部分的に正**。後述の「サービスの環境変数」問題 |

BigPickle に落ちる確認済みの条件は **有効な設定ファイルに `model` が無いこと**のみ。ルートの `opencode.json` は `.gitignore`（`/opencode.json`）対象で、`make setup` を実行しない限り clone 直後には存在しない。実機でも、ルートの `opencode.json` を退避すると既定モデルが OrcaCyber から別モデルに切り替わり、戻すと即座に復帰した（設定はホットリロードされる）。

> 未確認: 報告者の環境で実際に何が起きていたか。再現できたのは上記の「設定ファイル不在」のみで、報告者側のファイルを見ていない。`make dev` で BigPickle のままなら、`ls opencode.json` と `opencode models | grep orca` で切り分けてほしい。TUI 本体は TTY・実キーが無いため起動しておらず、サーバ API（`GET /api/model/default`）と `models` コマンドで確認し、TUI 側の選択順は `packages/tui/src/context/local.tsx` を読んで確認した。

## モデル選択の順序（新規セッション）

1. TUI 内で手動選択したモデル
2. エージェント自身の `model`（`.opencode/agent/*.md` の frontmatter）
3. `--model` 引数
4. 設定の `model`（**そのモデルが利用可能な一覧にある場合のみ**）
5. `model.json` の `recent`（`$XDG_STATE_HOME/opencode/`）
6. 利用可能な先頭モデル

設定の `model` が一覧に無い（プロバイダ未定義・設定ファイル不在）と 5→6 に落ち、未ログインでは BigPickle になる。`audit` / `exploit` などは `.opencode/agent/*.md` で 2 のモデルが固定されるが、設定ファイル不在のときにそのプロバイダが利用可能になるかは未検証。

## 実際に踏みやすい落とし穴: サービスの環境変数

v2 の TUI は長寿命のバックグラウンドサービス（`serve --service`）に接続する。`opencode.json` の `{env:ORCAROUTER_API_KEY}` は**サービスプロセスの環境変数**で解決される。

実測（サンドボックス、ダミーキー）:

| 状況 | `settings.apiKey` |
|---|---|
| キー無しで起動済みのサービスに `bun run --env-file=.env dev ...` で接続 | `''`（空のまま） |
| サービスを停止して `--env-file` 付きで再起動 | `.env` の値 |
| `bun run --env-file=.env dev service restart` | `.env` の値 |
| `service set env ORCAROUTER_API_KEY <値>` | 設定した値 |

キー未設定でもモデル選択自体は OrcaCyber のままで、**認証エラーはリクエスト時にしか出ない**（BigPickle にはならない）。

`.env` の BOM（`.env.example` の先頭にあった）は Bun 1.4.4 では無害だったが、不要なので除去した。

## 変更内容

- `Makefile`: `make dev` 前に `make check`（`opencode.json` 不在・キー未設定/プレースホルダの警告のみ）、`make restart` を追加
- `.env.example`: BOM 除去、末尾改行
- `HABAKIRI_README.md`: 「Bun は `.env` を自動ロード」の記述を実態に合わせて修正、トラブルシューティングとグローバル設定手順を追加、設計書リンク（`DESIGN.md` → `HABAKIRI_DESIGN.md`）を修正
- 追加の対応は不要と判断したもの: `packages/cli/.env`（`make setup` が既にコピー。Bun は起動ディレクトリの `.env` を自動ロード）、`packages/cli/opencode.json`

## グローバル設定の検証

`opencode.json.example` を `$XDG_CONFIG_HOME/opencode/opencode.json` に置き、プロジェクト設定なしで `/tmp` と `packages/cli` の両方から `orcarouter/orca/orcacyber-zero-1.5` が既定になること、`service set env` の値が `apiKey` に入ることを確認。

## OpenCode 担当への申し送り（本メモでは未着手）

1. **サービスと `.env` の乖離**: `make dev` が既存サービスの環境変数を変えられない点は、`--standalone` を既定にするか、`dev` 起動時にキー差分を検知して再起動するかの設計判断が要る（共有サービスを落とすと他クライアントのセッションに影響するため、Claude 範囲外）。
2. `orca-router` / `findings-compactor` の no-op、`.opencode/tool/*.ts` の v2 動作確認（問題 2・3）は未対応。
3. 本メモの再現手順は、`HOME` と `XDG_*` をサンドボックスに向けて `bun run --cwd packages/cli src/index.ts service status` / `service get password` でサービスの URL とパスワードを取り、`curl -u opencode:<pw> -H "x-opencode-directory: <dir>" <url>/api/model/default` を叩く方法。
