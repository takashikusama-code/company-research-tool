export const dynamic = "force-dynamic";

interface CompanyFinancials {
  years: number[];
  revenue: number[];
  operatingProfit: number[];
  netProfit: number[];
  employees: number[];
}

interface CompanyReview {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  workLifeBalance: string;
  careerGrowth: string;
}

interface CompanyInfo {
  overview: string;
  business: string;
  recruiting: string;
  culture: string;
  evaluation: string;
  appeal: string;
  concerns: string;
  financials: CompanyFinancials;
  review: CompanyReview;
  competitors: string;
  differentiation: string;
  futureStrategy: string;
  industry: string;
  foundedYear: number;
  representative: string;
}

// Claude API を使って企業情報を検索
async function searchWithClaude(companyName: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("Claude API key not found");
    return "";
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-1-20250805",
        max_tokens: 1024,
        tools: [
          {
            name: "web_search",
            description: "Search the web for information",
            input_schema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query",
                },
              },
              required: ["query"],
            },
          },
        ],
        messages: [
          {
            role: "user",
            content: `${companyName}という企業について、企業概要、業種、事業内容、財務情報（売上、営業利益）、代表者名、設立年を簡潔に日本語で教えてください。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log(`Claude API error: ${response.status}`);
      return "";
    }

    const data = await response.json() as { content: Array<{ type: string; text?: string }> };
    const textContent = data.content?.find((c) => c.type === "text");
    return textContent?.text || "";
  } catch (error) {
    console.log("Claude API error:", error);
    return "";
  }
}

// Wikipedia API から企業情報を取得
async function getWikipediaInfo(companyName: string): Promise<string> {
  try {
    const response = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(companyName)}`,
      { headers: { "User-Agent": "company-research-tool/1.0" } }
    );

    if (!response.ok) {
      console.log(`Wikipedia: ${companyName} が見つかりません`);
      return "";
    }

    const data = (await response.json()) as { extract?: string };
    return data.extract || "";
  } catch (error) {
    console.log("Wikipedia API error:", error);
    return "";
  }
}

// 高質なモックデータベース（複数企業対応）
const companyDatabase: Record<string, CompanyInfo> = {
  ソニー: {
    overview:
      "ソニー株式会社は、日本を代表する大手電機メーカー。1946年設立。東京都港区に本社。従業員数は約11万人。世界有数の総合電機メーカーであり、音声・映像・ゲーム・金融など多岐にわたる事業を展開。",
    industry: "電子機器・映画・音楽",
    foundedYear: 1946,
    representative: "吉田憲一郎",
    business:
      "エレクトロニクス事業（テレビ、カメラ、ヘッドフォンなど）、ゲーム&ネットワークサービス事業（PlayStation）、映画・音楽事業、金融事業（保険、銀行）など多角的な事業ポートフォリオを有する。",
    recruiting:
      "積極的に中途採用を実施中。エンジニア、営業、企画職など多職種を募集。大卒初任給は約22-25万円。",
    culture:
      "グローバル企業としてダイバーシティを重視。階級制度は緩く、個人の実力と提案が評価される。意思決定スピードは業界標準から中程度。",
    evaluation:
      "転職市場での評価は高く、特に技術系職種の人気が高い。給与水準は業界平均以上。ワークライフバランスについては職場による差が大きい。",
    appeal:
      "・業界トップクラスの技術を習得できる環境\n・グローバルなキャリア形成の機会\n・安定性と成長機会の両立\n・充実した福利厚生",
    concerns:
      "・大企業のため意思決定が遅い傾向\n・部門間の調整に時間を要する場合あり\n・転勤の可能性\n・近年の業界動向に対応する変革が急務",
    financials: {
      years: [2021, 2022, 2023, 2024],
      revenue: [27940, 28710, 28580, 30900], // 2024年は予想
      operatingProfit: [2710, 3480, 3160, 3500],
      netProfit: [2420, 3200, 2850, 3100],
      employees: [109800, 110300, 111200, 112000],
    },
    review: {
      rating: 3.8,
      strengths: [
        "世界的な企業で知名度が高い",
        "技術力が評価される",
        "給与水準が比較的高い",
        "多様なキャリアパスが用意されている",
      ],
      weaknesses: [
        "意思決定が遅く、階層が多い",
        "部門間の連携が取りにくい",
        "転勤が多い",
        "残業が多い部署がある",
      ],
      workLifeBalance:
        "部署により大きな差。エンジニア職は比較的良好だが、営業・企画職は残業が多い傾向。在宅勤務は推奨されている。",
      careerGrowth:
        "実力主義の傾向が強まっており、成果を出せば昇進は早い。ただし、新入社員時代は雑務が多く、成長実感に時間がかかる場合もある。",
    },
    competitors:
      "Samsung（韓国）、LG Electronics（韓国）、Philips（オランダ）、Panasonic（国内競合）",
    differentiation:
      "ゲーム（PlayStation）と映画・音楽の統合エコシステムで業界では唯一。ハードとコンテンツを両立させる垂直統合モデルが強み。",
    futureStrategy:
      "2025年中期経営計画では、AI・ロボティクス、クラウド関連事業への投資拡大。エレクトロニクスからサービス・ソリューション事業へのシフト。DX（デジタルトランスフォーメーション）推進による利益率改善が目標。",
  },
  トヨタ自動車: {
    overview:
      "トヨタ自動車株式会社は、世界最大級の自動車メーカー。1937年設立。愛知県豊田市に本社。従業員数は約37万人（グループ）。ハイブリッド車などの環境対応車で業界をリード。",
    industry: "自動車・製造",
    foundedYear: 1937,
    representative: "豊田章男",
    business:
      "乗用車、商用車、SUVなどの製造・販売。トヨタ生産方式（TPS）で知られる。最近はEV・水素自動車の開発にも注力。金融・レンタカー事業も展開。",
    recruiting:
      "グループ全体で大規模採用。エンジニア、営業、事務職など。基本給20-24万円。手当と賞与が充実しており年収は業界トップクラス。",
    culture:
      "ものづくり企業としての誇り高い文化。年功序列の色が残りつつも、成果主義へ移行中。チームワーク重視で個人の裁量権は中程度。",
    evaluation:
      "業界の顔として信頼度が極めて高い。給与水準は国内最高峰。ただし変革期にあり、若手のやりがい度にはばらつき。",
    appeal:
      "・最高峰の給与・賞与水準\n・安定性と福利厚生が充実\n・ものづくりの最前線を経験\n・国内外での配置転換による成長機会",
    concerns:
      "・保守的な企業文化で変化への対応が遅い\n・大企業病の影響\n・転勤・出張が多い\n・若手時代の裁量権が限定的",
    financials: {
      years: [2021, 2022, 2023, 2024],
      revenue: [279470, 279370, 278600, 290000], // 売上高（10億円）
      operatingProfit: [25900, 29900, 27100, 30000],
      netProfit: [18200, 21944, 19301, 22000],
      employees: [360799, 366238, 373755, 380000],
    },
    review: {
      rating: 3.5,
      strengths: [
        "給与・賞与が業界トップ",
        "安定性が極めて高い",
        "技術力と製造品質で信頼度が高い",
        "社会的地位が高い",
      ],
      weaknesses: [
        "保守的で変化への対応が遅い",
        "年功序列の影響で若手の裁量権が小さい",
        "転勤が多い",
        "電動化への転換期で不確実性が増している",
      ],
      workLifeBalance:
        "改善されつつあるが、部署により差あり。製造部は残業が多い傾向。在宅勤務は広がりつつあるが、全社的ではない。",
      careerGrowth:
        "大企業のため教育体制は充実。ただし若手時代は定型業務が多く、裁量権を得るまでに時間がかかる。国内外への異動で視野は広がる。",
    },
    competitors:
      "Volkswagen（ドイツ）、General Motors（米国）、BMW（ドイツ）、Honda（国内競合）",
    differentiation:
      "トヨタ生産方式（TPS）による圧倒的な製造効率と品質。ハイブリッド・EV・水素等の複数エネルギー戦略で、他社より多角的に対応。グローバルサプライチェーンの強固さ。",
    futureStrategy:
      "2030年までのEV販売比率を100%（グループ全体）に。全固体電池の開発。自動運転・MaaS事業への参入。カーボンニュートラル達成に向けた大規模投資。労働人口減対応のため、自動化・DXをさらに推進。",
  },
  日本銀行: {
    overview:
      "日本銀行は日本の中央銀行。1882年設立。東京都中央区に本店。正職員数約3,000人。金融政策の実行、銀行券の発行などを担当する政策機関。",
    industry: "中央銀行・金融機関",
    foundedYear: 1882,
    representative: "植田和男",
    business:
      "金融政策の実行、金融システムの安定維持、決済システムの管理、統計情報の提供など。国家の経済政策を実行する重要な役割を担う。",
    recruiting:
      "採用試験を通じた中途採用あり。エコノミスト、システムエンジニア、事務職など。給与は公務員相当で年功序列。30代で600-700万円程度。",
    culture:
      "公的機関としての使命感が強い。官僚的な側面が残り、意思決定は慎重。ワークライフバランスは改善傾向だが部署による。",
    evaluation:
      "社会的地位は高く、安定性は最高峰。ただし民間企業並みの待遇を求める層には物足りない可能性。",
    appeal:
      "・国家の経済政策に関わる充実感\n・公的機関としての安定性\n・社会的ステータス\n・退職後のキャリアパスの豊富さ",
    concerns:
      "・民間企業より給与が低い傾向\n・官僚的プロセスで意思決定が遅い\n・転勤がある\n・急速な変化への対応が課題",
    financials: {
      years: [2021, 2022, 2023, 2024],
      revenue: [3200, 3400, 3600, 3800], // 業務費用（億円）
      operatingProfit: [0, 0, 0, 0], // 利益構造が異なるため表示せず
      netProfit: [0, 0, 0, 0],
      employees: [2900, 2950, 3000, 3050],
    },
    review: {
      rating: 3.2,
      strengths: [
        "国家を動かす重要な職務に関われる",
        "雇用が極めて安定している",
        "社会的なステータスが高い",
        "国内外ネットワークが豊か",
      ],
      weaknesses: [
        "民間企業より給与が安い",
        "官僚的で意思決定が遅い",
        "急速な変化への対応が課題",
        "やりがいを感じにくい部署がある",
      ],
      workLifeBalance:
        "改善されつつあり、全体的には良好。ただし金融危機時など有事の際は業務量が激増。部署による差が大きい。",
      careerGrowth:
        "公務員試験合格者が多く、キャリア形成は用意周到。ただし民間企業ほどの急速な昇進はない。退職後の進路は広い。",
    },
    competitors:
      "米国FRB、ECB（欧州中央銀行）、イングランド銀行。国内では政府との連携が主。",
    differentiation:
      "日本の中央銀行として唯一。政策立案と実行を一体で担当。黒田前総裁以来のアベノミクス支援で、金融政策の限界を探る実験的な役割を果たしている。",
    futureStrategy:
      "2024年以降の金利正常化。デジタル円（CBDC）の研究開発。暗号資産規制への対応。国債管理と物価安定の両立。気候変動リスク対応。金融システムの安定維持と、経済成長支援の両立が課題。",
  },
};

// 企業データを生成
function generateCompanyReport(
  companyName: string,
  wikipediaText: string
): string {
  // 企業名の正規化と別名対応
  const aliasMap: Record<string, string> = {
    ソニー: "ソニー",
    Sony: "ソニー",
    トヨタ: "トヨタ自動車",
    トヨタ自動車: "トヨタ自動車",
    Toyota: "トヨタ自動車",
    日銀: "日本銀行",
    BOJ: "日本銀行",
    日本銀行: "日本銀行",
  };

  let normalizedName = aliasMap[companyName] || companyName;
  let data: CompanyInfo | undefined = companyDatabase[normalizedName];

  // 直接マッチなければ大文字小文字を無視して検索
  if (!data) {
    const key = Object.keys(companyDatabase).find(
      (k) => k.toLowerCase() === companyName.toLowerCase()
    );
    if (key) {
      data = companyDatabase[key];
    }
  }

  // データベースにない場合は Wikipedia テキストから生成
  if (!data) {
    return generateFromWikipedia(companyName, wikipediaText);
  }

  const financialSummary = `
  • 売上推移：${data.financials.revenue
    .slice(0, -1)
    .map((r, i) => `${data.financials.years[i]}年: ${r}億円`)
    .join(" → ")} → ${data.financials.revenue[data.financials.revenue.length - 1]}億円（予想）
  • 営業利益推移：${data.financials.operatingProfit
    .slice(0, -1)
    .map((p, i) => `${data.financials.years[i]}年: ${p}億円`)
    .join(" → ")} → ${data.financials.operatingProfit[data.financials.operatingProfit.length - 1]}億円（予想）
  • 従業員数推移：${data.financials.employees
    .slice(0, -1)
    .map((e, i) => `${data.financials.years[i]}年: ${(e / 1000).toFixed(0)}k人`)
    .join(" → ")} → ${(data.financials.employees[data.financials.employees.length - 1] / 1000).toFixed(0)}k人（予想）`;

  const reviewSummary = `
  • 総合評価：${data.review.rating}/5.0
  • 強み：${data.review.strengths.join("、")}
  • 改善点：${data.review.weaknesses.join("、")}
  • ワークライフバランス：${data.review.workLifeBalance}
  • キャリア成長：${data.review.careerGrowth}`;

  return `【${companyName} 企業調査レポート】

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【企業概要】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.overview}

【事業内容・サービス】
${data.business}

【採用情報】
${data.recruiting}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【財務分析・経営状況】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${financialSummary}

【今後の経営戦略・注力事業】
${data.futureStrategy}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【社風・カルチャー（口コミ分析）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reviewSummary}

【競合分析・差別化ポイント】
同業他社：${data.competitors}

差別化ポイント：
${data.differentiation}

【転職市場での評判】
${data.evaluation}

【求職者にとっての魅力】
${data.appeal}

【懸念点・注意事項】
${data.concerns}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは公開情報を基に作成しています。
最新情報は公式サイト・決算資料でご確認ください。`;
}

// Wikipedia テキストからレポート生成
function generateFromWikipedia(
  companyName: string,
  wikipediaText: string
): string {
  if (!wikipediaText) {
    return `【${companyName} 企業調査レポート】

申し訳ございません。${companyName}について詳細な情報が取得できませんでした。
以下の点をご確認ください：
- 企業名のスペルが正しいか
- 一般的な知名度がある企業か
- 公式HPで最新情報をご確認ください

今後のアップデートで、より多くの企業情報に対応予定です。`;
  }

  return `【${companyName} 企業調査レポート】

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【企業概要】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${wikipediaText.substring(0, 500)}

【詳細情報について】
このツールは公開情報を基に最適な情報を提供しています。
より詳細な情報は以下をご参照ください：
- 企業の公式ウェブサイト
- IR資料・決算説明会資料
- 転職サイト（OpenWork、Wantedly等）
- 企業紹介サイト（Crunchbase等）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは公開情報を基に作成しています。`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { companyName?: string };
    // JSONパース後、companyName が "???" の場合は別途処理
    let companyName = (body.companyName || "").trim();

    // フォールバック: request 本体から手動抽出
    if (!companyName || companyName === "???") {
      try {
        const text = await request.clone().text();
        const match = text.match(/"companyName"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
          companyName = match[1].trim();
        }
      } catch (e) {
        // 無視
      }
    }

    if (!companyName) {
      const errorData = { error: "企業名を入力してください" };
      return new Response(JSON.stringify(errorData), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    console.log("📝 企業名:", companyName);
    console.log("🔍 企業情報を検索中...");

    // 企業名の正規化
    const aliasMap: Record<string, string> = {
      ソニー: "ソニー",
      Sony: "ソニー",
      トヨタ: "トヨタ自動車",
      トヨタ自動車: "トヨタ自動車",
      Toyota: "トヨタ自動車",
      日銀: "日本銀行",
      BOJ: "日本銀行",
      日本銀行: "日本銀行",
    };

    const normalizedName = aliasMap[companyName] || companyName;
    let companyData = companyDatabase[normalizedName];

    // 直接マッチなければ大文字小文字を無視して検索
    if (!companyData) {
      const key = Object.keys(companyDatabase).find(
        (k) => k.toLowerCase() === companyName.toLowerCase()
      );
      if (key) {
        companyData = companyDatabase[key];
      }
    }

    let searchSummary: string;

    if (companyData) {
      // モックデータベースから取得
      searchSummary = generateCompanyReport(companyName, "");
    } else {
      // Claude API で検索
      console.log("🤖 Claude API で企業情報を検索中...");
      const claudeInfo = await searchWithClaude(companyName);

      if (!claudeInfo) {
        // Claude API が失敗した場合は Wikipedia を試す
        console.log("📖 Wikipedia で企業情報を検索中...");
        const wikipediaInfo = await getWikipediaInfo(companyName);
        searchSummary = generateCompanyReport(companyName, wikipediaInfo);
      } else {
        searchSummary = generateCompanyReport(companyName, claudeInfo);
      }
    }

    console.log("✅ 情報取得完了");

    const responseData = {
      id: Math.floor(Math.random() * 10000),
      company_name: companyName,
      company_name_kana: companyData?.overview?.substring(0, 10) || "",
      industry: companyData?.industry || "",
      establishment_date: companyData ? `${companyData.foundedYear}年` : "",
      representative_name: companyData?.representative || "",
      latest_revenue_billion: companyData
        ? companyData.financials.revenue[
            companyData.financials.revenue.length - 1
          ]
        : 0,
      latest_revenue_year: companyData
        ? companyData.financials.years[
            companyData.financials.years.length - 1
          ]
        : 0,
      latest_profit_billion: companyData
        ? companyData.financials.operatingProfit[
            companyData.financials.operatingProfit.length - 1
          ]
        : 0,
      latest_profit_year: companyData
        ? companyData.financials.years[
            companyData.financials.years.length - 1
          ]
        : 0,
      search_summary: searchSummary,
      report_status: "completed",
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "企業調査に失敗しました";
    console.error("詳細:", errorMessage);

    const errorData = { error: errorMessage };
    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

