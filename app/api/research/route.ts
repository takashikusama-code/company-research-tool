import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchCompanyInfo(companyName: string): Promise<{
  summary: string;
  sources: SearchResult[];
}> {
  const searchQuery = `${companyName} 企業情報 決算 売上 設立`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      tools: [
        {
          name: 'web_search',
          description: 'Search the web for information',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
            },
            required: ['query'],
          },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `企業「${companyName}」について調査してください。以下の情報があれば取得してください：
            - 基本情報（設立日、業種、代表者など）
            - 決算情報（売上高、利益など）
            - 企業概要・事業内容

            日本語で簡潔にまとめてください。`,
        },
      ],
    });

    // web_search ツール呼び出しの結果を処理
    let summary = '';
    const sources: SearchResult[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        summary = block.text;
      }
    }

    return { summary, sources };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('企業情報の取得に失敗しました');
  }
}

async function parseCompanyData(
  companyName: string,
  searchSummary: string
): Promise<Partial<{
  company_name_kana: string;
  industry: string;
  establishment_date: string;
  representative_name: string;
  latest_revenue_billion: number;
  latest_revenue_year: number;
  latest_profit_billion: number;
  latest_profit_year: number;
}>> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `以下の企業情報テキストから、構造化データをJSON形式で抽出してください。値がない場合は null を返してください。

企業名: ${companyName}

情報:
${searchSummary}

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

JSONのみを返してください。説明文は含めないでください。`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') return {};

    try {
      const data = JSON.parse(content.text);
      return {
        company_name_kana: data.company_name_kana || undefined,
        industry: data.industry || undefined,
        establishment_date: data.establishment_date || undefined,
        representative_name: data.representative_name || undefined,
        latest_revenue_billion: data.latest_revenue_billion ? parseFloat(data.latest_revenue_billion) : undefined,
        latest_revenue_year: data.latest_revenue_year ? parseInt(data.latest_revenue_year) : undefined,
        latest_profit_billion: data.latest_profit_billion ? parseFloat(data.latest_profit_billion) : undefined,
        latest_profit_year: data.latest_profit_year ? parseInt(data.latest_profit_year) : undefined,
      };
    } catch {
      return {};
    }
  } catch (error) {
    console.error('Data parsing error:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName?.trim()) {
      return NextResponse.json({ error: '企業名を入力してください' }, { status: 400 });
    }

    // 企業情報をWeb検索で取得
    const { summary } = await searchCompanyInfo(companyName);

    // 検索結果から構造化データを抽出
    const parsedData = await parseCompanyData(companyName, summary);

    // Supabaseにレポートを保存
    const { data, error } = await supabase
      .from('company_reports')
      .insert({
        company_name: companyName,
        search_summary: summary,
        ...parsedData,
        report_status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'レポート保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}
