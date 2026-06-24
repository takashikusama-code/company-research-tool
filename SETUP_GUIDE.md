# セットアップ・デプロイガイド

## ステップ 1: Supabase プロジェクト作成

### 1.1 Supabase コンソールで新規プロジェクト作成
- https://supabase.com にアクセス
- 「New Project」をクリック
- 組織・プロジェクト名を入力（例：`company-research-tool`）
- リージョンを選択（例：`Tokyo`）
- パスワードを設定
- 「Create new project」をクリック

### 1.2 データベーステーブル作成
1. Supabase ダッシュボード > SQL エディタを開く
2. 「New Query」をクリック
3. `SUPABASE_SCHEMA.sql` の内容をコピーして貼り付け
4. 「Run」をクリック

### 1.3 API キー取得
1. Supabase ダッシュボード > Settings > API
2. 以下をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ステップ 2: Claude API キー取得

1. https://console.anthropic.com にアクセス
2. API キーを生成（またはコピー）
3. `ANTHROPIC_API_KEY` として保存

> ⚠️ **セキュリティ注意**: API キーを GitHub に commit しないこと

---

## ステップ 3: ローカル開発環境セットアップ

### 3.1 環境変数設定

`C:\Users\takas\Downloads\company-research-tool\.env.local` を作成：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 3.2 開発サーバー起動

```bash
cd C:\Users\takas\Downloads\company-research-tool
npm run dev
```

http://localhost:3000 でアプリが起動します

---

## ステップ 4: GitHub リポジトリ作成

### 4.1 リモートリポジトリを GitHub に作成

1. https://github.com/new にアクセス
2. リポジトリ名：`company-research-tool`
3. 「Create repository」をクリック

### 4.2 ローカルリポジトリをプッシュ

```bash
cd C:\Users\takas\Downloads\company-research-tool

# リモートを追加（your-username を置換）
git remote add origin https://github.com/your-username/company-research-tool.git

# メインブランチをプッシュ
git branch -M main
git push -u origin main
```

---

## ステップ 5: Vercel へのデプロイ

### 5.1 Vercel コンソールでプロジェクト作成

1. https://vercel.com にアクセス
2. 「New Project」をクリック
3. GitHub リポジトリ（`company-research-tool`）を選択
4. 「Import」をクリック

### 5.2 環境変数設定

1. Project Settings > Environment Variables を開く
2. 以下を追加：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`
   - `ANTHROPIC_API_KEY` = `sk-ant-xxxxx`

### 5.3 デプロイ

「Deploy」をクリックしてデプロイを実行

> デプロイ後、Vercel が自動で URL を生成します（例：`https://company-research-tool.vercel.app`）

---

## テスト

### ローカルテスト

1. http://localhost:3000 を開く
2. 企業名を入力（例：「トヨタ自動車」）
3. 「調査」ボタンをクリック
4. レポートが生成されることを確認

### Vercel でのテスト

1. Vercel ダッシュボードから生成された URL を開く
2. ローカルと同じテストを実行

---

## トラブルシューティング

### ビルドエラー：`supabaseUrl is required`
- `.env.local` ファイルが存在するか確認
- `NEXT_PUBLIC_SUPABASE_URL` が正しく設定されているか確認

### API エラー：`企業情報の取得に失敗しました`
- `ANTHROPIC_API_KEY` が正しく設定されているか確認
- Claude API の使用額が不足していないか確認

### Supabase 接続エラー
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
- Supabase ダッシュボードでテーブルが作成されているか確認

### PDF 保存が動作しない
- ブラウザの開発者ツール（F12）でコンソールエラーを確認
- html2pdf.js が正しくロードされているか確認

---

## 運用

### レポート履歴の確認

- Supabase ダッシュボード > Tables > `company_reports` からすべてのレポートを確認可能

### レポートの削除

Supabase ダッシュボードから直接削除可能

### API の監視

Vercel Analytics でトラフィック・エラーを監視可能
