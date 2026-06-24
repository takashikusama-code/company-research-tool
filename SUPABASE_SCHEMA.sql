-- Supabase テーブル設計

-- 企業レポートテーブル
CREATE TABLE company_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 基本情報
  company_name_kana VARCHAR(255),
  industry VARCHAR(100),
  establishment_date DATE,
  representative_name VARCHAR(255),

  -- 決算情報
  fiscal_year_end DATE,
  latest_revenue_billion DECIMAL(10, 2),
  latest_revenue_year INTEGER,
  latest_profit_billion DECIMAL(10, 2),
  latest_profit_year INTEGER,

  -- Web検索結果
  search_summary TEXT,
  search_sources JSONB, -- {"urls": [...], "snippet": "..."}

  -- メタデータ
  is_public BOOLEAN DEFAULT TRUE,
  report_status VARCHAR(50) DEFAULT 'completed' -- draft, in_progress, completed
);

-- レポート履歴テーブル
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES company_reports(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_query TEXT,
  search_results JSONB, -- Claude API の web_search 結果をそのまま保存
  report_version INTEGER
);

-- インデックス
CREATE INDEX idx_company_reports_company_name ON company_reports(company_name);
CREATE INDEX idx_company_reports_created_at ON company_reports(created_at DESC);
CREATE INDEX idx_report_history_report_id ON report_history(report_id);
