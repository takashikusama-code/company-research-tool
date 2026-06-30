export async function POST(request: Request) {
  const body = await request.json();
  const companyName = body.companyName || '';

  if (!companyName.trim()) {
    return Response.json({ error: '企業名を入力してください' }, { status: 400 });
  }

  const mockData: { [key: string]: unknown } = {
    'トヨタ自動車': {
      id: 1,
      company_name: 'トヨタ自動車',
      company_name_kana: 'トヨタジドウシャ',
      industry: '自動車製造',
      establishment_date: '1937-08-28',
      representative_name: '豊田章男',
      search_summary: 'トヨタは世界トップの自動車メーカーです。',
      latest_revenue_billion: 27500,
      latest_revenue_year: 2023,
      latest_profit_billion: 2500,
      latest_profit_year: 2023,
      report_status: 'completed',
      created_at: new Date().toISOString(),
    },
    'ソニー': {
      id: 2,
      company_name: 'ソニーグループ',
      company_name_kana: 'ソニーグループ',
      industry: '電子機器・映画・音楽',
      establishment_date: '1946-05-07',
      representative_name: '吉田憲一郎',
      search_summary: 'ソニーは多角的な事業を展開しています。',
      latest_revenue_billion: 28000,
      latest_revenue_year: 2023,
      latest_profit_billion: 2800,
      latest_profit_year: 2023,
      report_status: 'completed',
      created_at: new Date().toISOString(),
    },
    'Apple': {
      id: 3,
      company_name: 'Apple Inc.',
      company_name_kana: 'アップル',
      industry: 'コンピュータ・電子機器',
      establishment_date: '1976-04-01',
      representative_name: 'Tim Cook',
      search_summary: 'Appleはテクノロジー企業です。',
      latest_revenue_billion: 394000,
      latest_revenue_year: 2023,
      latest_profit_billion: 115000,
      latest_profit_year: 2023,
      report_status: 'completed',
      created_at: new Date().toISOString(),
    },
  };

  const name = companyName.toLowerCase();
  for (const key in mockData) {
    if (key.toLowerCase().includes(name) || name.includes(key.toLowerCase())) {
      return Response.json(mockData[key]);
    }
  }

  return Response.json({
    id: Math.floor(Math.random() * 10000),
    company_name: companyName,
    company_name_kana: companyName,
    industry: '不明',
    establishment_date: null,
    representative_name: null,
    search_summary: `${companyName}についての情報が見つかりました。`,
    latest_revenue_billion: null,
    latest_revenue_year: null,
    latest_profit_billion: null,
    latest_profit_year: null,
    report_status: 'completed',
    created_at: new Date().toISOString(),
  });
}
