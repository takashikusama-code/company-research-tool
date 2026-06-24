# 企業調査レポートツール

企業名を入力するだけで、Web検索で自動調査し、基本情報や決算データをまとめたレポートを作成・保存できるWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14 + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **AI/検索**: Anthropic Claude API
- **ホスティング**: Vercel
- **ソース管理**: GitHub

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルを作成（`.env.local.example` を参考）して、以下を設定：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-api-key
```

### 2. Supabaseセットアップ

1. [Supabase コンソール](https://supabase.com)で新規プロジェクトを作成
2. SQL エディタで [`SUPABASE_SCHEMA.sql`](./SUPABASE_SCHEMA.sql) を実行してテーブルを作成
3. プロジェクト設定から `URL` と `Anon Key` を取得

### 3. ローカル開発

```bash
npm install
npm run dev
```

## API エンドポイント

### POST `/api/research`
企業情報を検索してレポートを作成

### GET `/api/reports`
保存されたレポート一覧を取得

## 機能

- ✅ 企業名からの自動Web検索
- ✅ 基本情報の自動抽出
- ✅ 決算データの自動抽出
- ✅ レポート保存機能
- ✅ PDF エクスポート機能

## デプロイ（Vercel）

環境変数を設定後、GitHub リポジトリから Vercel で自動デプロイされます。
