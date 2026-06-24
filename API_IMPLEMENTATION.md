# API 実装詳細

## `/api/research` - 企業調査

企業名を受け取り、Claude API で Web 検索して企業情報を抽出し、Supabase に保存します。

### リクエスト

```http
POST /api/research
Content-Type: application/json

{
  "companyName": "トヨタ自動車"
}
```

### レスポンス

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "トヨタ自動車",
  "company_name_kana": "トヨタジドウシャ",
  "industry": "自動車製造",
  "establishment_date": "1937-08-28",
  "representative_name": "豊田章男",
  "latest_revenue_billion": 30000,
  "latest_revenue_year": 2023,
  "latest_profit_billion": 2000,
  "latest_profit_year": 2023,
  "search_summary": "トヨタ自動車は日本の大手自動車メーカーで...",
  "created_at": "2024-01-01T12:00:00.000Z",
  "updated_at": "2024-01-01T12:00:00.000Z",
  "report_status": "completed"
}
```

### 処理フロー

1. **入力検証**: `companyName` が入力されているか確認
2. **Web 検索**: Claude API の `web_search` ツールで企業情報を検索
   - プロンプト: `${companyName} 企業情報 決算 売上 設立`
   - モデル: `claude-opus-4-7`
   - 最大トークン: 2000
3. **データ抽出**: 検索結果から JSON フォーマットで構造化データを抽出
   - Claude に別途プロンプトで指定フォーマットを強制
   - 金額は「億円」単位で数値化
   - 日付は ISO 8601 フォーマット（YYYY-MM-DD）
4. **DB 保存**: Supabase の `company_reports` テーブルに INSERT
5. **レスポンス返却**: 保存されたレコードを返す

### エラーハンドリング

| エラー | ステータス | 説明 |
|---|---|---|
| 企業名が空 | 400 | `companyName` が未入力 |
| Web 検索失敗 | 500 | Claude API エラー |
| データ抽出失敗 | 500 | JSON パース失敗 |
| DB 保存失敗 | 500 | Supabase エラー |

---

## `/api/reports` - レポート一覧取得

保存されたレポートを一覧取得します。最新 20 件を返します。

### リクエスト

```http
GET /api/reports
```

### レスポンス

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "トヨタ自動車",
    "company_name_kana": "トヨタジドウシャ",
    "industry": "自動車製造",
    ...
  },
  ...
]
```

---

## Claude API web_search ツール

Claude Opus 4.7 で web_search ツールを使用して、リアルタイムの Web 検索を実行します。

### ツール定義

```json
{
  "name": "web_search",
  "description": "Search the web for information",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      }
    },
    "required": ["query"]
  }
}
```

### 検索クエリ例

```
トヨタ自動車 企業情報 決算 売上 設立
ソニー 企業 決算情報
日本銀行 基本情報 設立年
```

---

## データ抽出プロンプト

Claude に JSON フォーマットでの構造化データ抽出を指示：

```
以下の企業情報テキストから、構造化データをJSON形式で抽出してください。値がない場合は null を返してください。

企業名: {companyName}

情報:
{searchSummary}

以下のJSONスキーマで抽出してください：
{
  "company_name_kana": "カナ表記",
  "industry": "業種",
  "establishment_date": "設立日（YYYY-MM-DD形式）",
  "representative_name": "代表者名",
  "latest_revenue_billion": "売上高（億円、数値のみ）",
  "latest_revenue_year": "売上高の年度（YYYY形式）",
  "latest_profit_billion": "営業利益（億円、数値のみ）",
  "latest_profit_year": "営業利益の年度（YYYY形式）"
}

JSONのみを返してください。説明文は含めないでください。
```

---

## パフォーマンス最適化

### API レスポンス時間

- **Web 検索**: 3～10 秒（Claude API + ネットワーク）
- **データ抽出**: 1～2 秒（JSON パース）
- **DB 保存**: <100ms（Supabase）
- **合計**: 5～15 秒/リクエスト

### キャッシング戦略（今後の改善）

同じ企業名が複数回検索される場合、DB キャッシュを利用：

```ts
// 既に調査済みの企業かチェック
const existing = await supabase
  .from('company_reports')
  .select('*')
  .eq('company_name', companyName)
  .single();

if (existing) {
  return existing; // キャッシュされたデータを返す
}
```

---

## セキュリティ考慮事項

### API キー管理

- `ANTHROPIC_API_KEY` は環境変数で管理（Git にコミット厳禁）
- Vercel Environment Variables で安全に設定

### Supabase セキュリティ

- Row Level Security (RLS) は現在無効（将来的に有効化推奨）
- Anon Key は読み取り制限の権限のみ

### レート制限（推奨設定）

```ts
// 今後の実装
const rateLimit = {
  maxRequests: 100, // 1時間あたり100リクエスト
  windowMs: 3600000, // 1時間
};
```

---

## 今後の拡張

### 機能追加候補

1. **複数企業の一括検索**: 複数企業をバッチ処理
2. **定期更新**: 既存レポートの自動更新
3. **比較機能**: 複数企業の比較レポート
4. **AI 分析**: 財務分析の自動レポート生成
5. **CSV エクスポート**: レポート data の一括ダウンロード

### パフォーマンス改善

1. **キャッシング**: Redis でのレスポンス キャッシュ
2. **非同期処理**: Bull キューでバックグラウンド処理
3. **CDN**: 静的コンテンツの Vercel CDN キャッシュ
