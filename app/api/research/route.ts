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

// ── Claude API (web_search) 設定 ─────────────────────────────
// claude-3-5-sonnet-20241022: web_search_20250305 に対応しつつ、
// レスポンス時間の目安（10秒以内）を満たしやすい速度重視モデル。
// 品質を優先する場合は claude-opus-4-1-20250805 に切り替え可能。
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
const CLAUDE_API_VERSION = "2023-06-01";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
// web_search はサーバー側（Anthropic側）で実行されるため、通常のカスタムツールのような
// tool_use → tool_result の往復をこちらで組み立てる必要はない。
// ただし検索に時間がかかる場合、API が stop_reason: "pause_turn" を返し、
// 直前の assistant メッセージをそのまま送り返して継続する必要がある。
// そのための再送回数の上限（初回 + 追加リクエスト）。
const MAX_PAUSE_CONTINUATIONS = 1;
// searchWithClaude 全体（初回＋pause_turn再送含む）にかける時間予算（ミリ秒）
const CLAUDE_TIME_BUDGET_MS = 9000;

interface ClaudeContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface ClaudeMessageResponse {
  content: ClaudeContentBlock[];
  stop_reason: string;
}

async function callClaudeMessages(
  messages: Array<{ role: string; content: unknown }>,
  apiKey: string,
  signal: AbortSignal,
  useWebSearch = true
): Promise<ClaudeMessageResponse | null> {
  const tools = useWebSearch
    ? [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
        },
      ]
    : [];

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": CLAUDE_API_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      tools,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.log(`Claude API error: ${response.status} ${errText}`);
    return null;
  }

  return (await response.json()) as ClaudeMessageResponse;
}

// content 配列からテキストブロックだけを抽出して連結する
// （server_tool_use / web_search_tool_result などのブロックは無視する）
function extractText(content: ClaudeContentBlock[]): string {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n");
}

// テキストの中からJSONオブジェクトを抽出する。
// ```json ... ``` フェンスを優先し、無ければ最初の { から対応する } までを
// ブレースの深さをカウントして取り出す（前後に説明文が付いた場合の保険）。
function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenceMatch =
    text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : text;

  const start = candidate.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === "{") depth++;
    else if (candidate[i] === "}") {
      depth--;
      if (depth === 0) {
        const jsonStr = candidate.substring(start, i + 1);
        try {
          return JSON.parse(jsonStr) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Claude が返した生JSONを型安全な CompanyInfo に正規化する。
// 不明・欠損値は文字列なら空文字、数値なら0、配列なら空配列にフォールバックし、
// 万一想定外の型が返ってきてもダウンストリームの描画が壊れないようにする。
function normalizeClaudeCompanyData(raw: Record<string, unknown>): CompanyInfo {
  const asString = (v: unknown): string => (typeof v === "string" ? v : "");
  const asNumber = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;
  const asNumberArray = (v: unknown): number[] =>
    Array.isArray(v)
      ? v.filter((x): x is number => typeof x === "number" && Number.isFinite(x))
      : [];
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const financialsRaw = (raw.financials as Record<string, unknown>) || {};
  const reviewRaw = (raw.review as Record<string, unknown>) || {};

  const years = asNumberArray(financialsRaw.years);
  const revenue = asNumberArray(financialsRaw.revenue);
  const operatingProfit = asNumberArray(financialsRaw.operatingProfit);
  const netProfit = asNumberArray(financialsRaw.netProfit);
  const employees = asNumberArray(financialsRaw.employees);

  // 配列長が不揃いだと年度と数値がずれて表示されるため、最短の長さに揃える
  const lengths = [years.length, revenue.length, operatingProfit.length, netProfit.length, employees.length];
  const safeLen = revenue.length > 0 ? Math.min(...lengths) : 0;

  return {
    overview: asString(raw.overview),
    industry: asString(raw.industry),
    foundedYear: asNumber(raw.foundedYear),
    representative: asString(raw.representative),
    business: asString(raw.business),
    recruiting: asString(raw.recruiting),
    culture: asString(raw.culture),
    evaluation: asString(raw.evaluation),
    appeal: asString(raw.appeal),
    concerns: asString(raw.concerns),
    financials: {
      years: years.slice(0, safeLen),
      revenue: revenue.slice(0, safeLen),
      operatingProfit: operatingProfit.slice(0, safeLen),
      netProfit: netProfit.slice(0, safeLen),
      employees: employees.slice(0, safeLen),
    },
    review: {
      rating: asNumber(reviewRaw.rating),
      strengths: asStringArray(reviewRaw.strengths),
      weaknesses: asStringArray(reviewRaw.weaknesses),
      workLifeBalance: asString(reviewRaw.workLifeBalance),
      careerGrowth: asString(reviewRaw.careerGrowth),
    },
    competitors: asString(raw.competitors),
    differentiation: asString(raw.differentiation),
    futureStrategy: asString(raw.futureStrategy),
  };
}

function buildResearchPrompt(companyName: string): string {
  return `【重要】最後に「JSON のみを出力」してください。JSON以外のテキストを付けないこと。

あなたは企業リサーチのアシスタントです。web_searchツールを使って「${companyName}」という企業の最新情報を検索してください。

【検索戦略 - 必ず実行すること】
必ず以下のキーワードで複数回検索し、漏らさず情報を集めてから JSON を出力してください：
1. 企業概要・基本情報：「${companyName} 企業」「${companyName} 会社概要」
2. 業種・事業内容：「${companyName} 業種」「${companyName} 事業内容」
3. 設立年・代表者：「${companyName} 設立年」「${companyName} 設立年月日」「${companyName} 代表取締役」「${companyName} CEO」
4. 財務情報：「${companyName} 売上」「${companyName} 営業利益」「${companyName} 従業員数」「${companyName} 決算」

【出力ルール】
- 最後に JSON オブジェクト1つのみを出力。JSON 以外のテキストは 絶対に 付けないこと
- 検索で確認できなかった項目は：文字列は空文字 ""、数値は 0、配列は空配列 [] にすること
- 事実確認できた情報だけを記載し、推測・作成・省略はしないこと
- foundedYear：西暦（例：1946）。判明しなければ 0
- representative：代表取締役名など最高経営責任者の名前のみ
- financials.years/revenue/operatingProfit/netProfit/employees：全て同じ配列長。年度は古い順に。金額の単位は「億円」
- financials：判明した直近 1～3 期のデータのみ記載（未来予想は除外）

出力するJSONのフォーマット（この構造を厳守すること）：
{
  "overview": "",
  "industry": "",
  "foundedYear": 0,
  "representative": "",
  "business": "",
  "recruiting": "",
  "culture": "",
  "evaluation": "",
  "appeal": "",
  "concerns": "",
  "financials": {
    "years": [],
    "revenue": [],
    "operatingProfit": [],
    "netProfit": [],
    "employees": []
  },
  "review": {
    "rating": 0,
    "strengths": [],
    "weaknesses": [],
    "workLifeBalance": "",
    "careerGrowth": ""
  },
  "competitors": "",
  "differentiation": "",
  "futureStrategy": ""
}`;
}

// 取得した企業データで重要フィールドが空かどうかを判定
function hasCriticalDataGaps(data: CompanyInfo): boolean {
  const gaps = {
    industry: !data.industry || data.industry.trim() === "",
    foundedYear: data.foundedYear === 0,
    representative: !data.representative || data.representative.trim() === "",
    businessInfo: !data.business || data.business.trim() === "",
  };

  // 3つ以上欠けている場合は「重要フィールドに穴がある」と判定
  const gapCount = Object.values(gaps).filter(Boolean).length;
  console.log(
    `📊 データギャップ分析：industry=${gaps.industry}, foundedYear=${gaps.foundedYear}, representative=${gaps.representative}, business=${gaps.businessInfo} (計${gapCount}個欠落)`
  );
  return gapCount >= 3;
}

// 補完クエリ：重要フィールドが足りない場合、別途検索させる
function buildFollowupPrompt(companyName: string, partialData: CompanyInfo): string {
  const missingFields: string[] = [];
  if (!partialData.industry) missingFields.push("業種");
  if (partialData.foundedYear === 0) missingFields.push("設立年");
  if (!partialData.representative) missingFields.push("代表取締役名");
  if (!partialData.business) missingFields.push("事業内容");

  return `前回の検索では「${missingFields.join("、")}」が取得できませんでした。
「${companyName}」の企業について、以下の情報を web_search で改めて検索して、必ず確認してください：

【優先検索キーワード】
- 「${companyName} 業種」「${companyName} 事業」
- 「${companyName} 設立年」「${companyName} 設立年月日」
- 「${companyName} 代表」「${companyName} 代表取締役」「${companyName} CEO」
- 「${companyName} 売上」「${companyName} 従業員」

検索結果から確認できた情報について、以下のJSON（指定フィールドのみ）を出力してください：
{
  "industry": "",
  "foundedYear": 0,
  "representative": "",
  "business": "",
  "financials": {
    "years": [],
    "revenue": [],
    "operatingProfit": [],
    "netProfit": [],
    "employees": []
  }
}

【重要】
- 出力は JSON のみ。説明文は付けないこと
- 判明した情報だけを記載。推測は絶対にしないこと
- foundedYear は西暦の数字のみ（例：1946）。判明しなければ 0
- 金額の単位は「億円」`;
}

// Claude API + web_search ツールを使って企業情報をリアルタイム検索し、構造化データを返す
async function searchWithClaude(companyName: string): Promise<CompanyInfo | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("Claude API key not found");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLAUDE_TIME_BUDGET_MS);

  try {
    // ━━━━━━━ ステップ1：初期検索 ━━━━━━━
    let messages: Array<{ role: string; content: unknown }> = [
      { role: "user", content: buildResearchPrompt(companyName) },
    ];

    let finalResponse: ClaudeMessageResponse | null = null;

    for (let attempt = 0; attempt <= MAX_PAUSE_CONTINUATIONS; attempt++) {
      const result = await callClaudeMessages(messages, apiKey, controller.signal);
      if (!result) {
        return null;
      }

      finalResponse = result;

      if (result.stop_reason !== "pause_turn") {
        break;
      }

      // 検索継続: 直前の assistant メッセージ（encrypted_content を含む）をそのまま送り返す
      messages = [...messages, { role: "assistant", content: result.content }];
    }

    if (!finalResponse) {
      return null;
    }

    const text = extractText(finalResponse.content);
    const json = extractJsonObject(text);
    if (!json) {
      console.log("Claude response did not contain parseable JSON");
      return null;
    }

    let companyData = normalizeClaudeCompanyData(json);

    // ━━━━━━━ ステップ2：検証と補完 ━━━━━━━
    if (hasCriticalDataGaps(companyData)) {
      console.log("⚠️  重要フィールドに穴があります。フォローアップ検索を実施...");

      // 補完クエリで再検索
      const followupMessages: Array<{ role: string; content: unknown }> = [
        ...messages,
        { role: "assistant", content: finalResponse.content },
        { role: "user", content: buildFollowupPrompt(companyName, companyData) },
      ];

      const followupResult = await callClaudeMessages(
        followupMessages,
        apiKey,
        controller.signal
      );
      if (followupResult) {
        const followupText = extractText(followupResult.content);
        const followupJson = extractJsonObject(followupText);
        if (followupJson) {
          console.log("✅ フォローアップ検索でデータを補完しました");
          // 型安全にマージ
          const safeFollowup = normalizeClaudeCompanyData(followupJson);
          companyData = {
            ...companyData,
            industry: safeFollowup.industry || companyData.industry,
            foundedYear: safeFollowup.foundedYear || companyData.foundedYear,
            representative: safeFollowup.representative || companyData.representative,
            business: safeFollowup.business || companyData.business,
            financials: {
              years: safeFollowup.financials.years.length
                ? safeFollowup.financials.years
                : companyData.financials.years,
              revenue: safeFollowup.financials.revenue.length
                ? safeFollowup.financials.revenue
                : companyData.financials.revenue,
              operatingProfit: safeFollowup.financials.operatingProfit.length
                ? safeFollowup.financials.operatingProfit
                : companyData.financials.operatingProfit,
              netProfit: safeFollowup.financials.netProfit.length
                ? safeFollowup.financials.netProfit
                : companyData.financials.netProfit,
              employees: safeFollowup.financials.employees.length
                ? safeFollowup.financials.employees
                : companyData.financials.employees,
            },
          };
        }
      }
    }

    return companyData;
  } catch (error) {
    console.log("Claude API error:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Wikipedia API から企業情報を取得（Claude API が使えない場合の最終フォールバック）
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

function orFallback(
  value: string,
  fallback = "情報が確認できませんでした。公式サイト等でご確認ください。"
): string {
  return value && value.trim() ? value : fallback;
}

function formatFinancials(financials: CompanyFinancials): string {
  if (!financials.revenue.length) {
    return "  財務データを検索結果から特定できませんでした。IR資料・決算短信をご確認ください。";
  }

  const years = financials.years;
  const buildLine = (label: string, values: number[], unit: string): string => {
    if (!values.length) return `  • ${label}：データなし`;
    const parts = values.map((v, i) => `${years[i] ?? "?"}年: ${v}${unit}`);
    return `  • ${label}：${parts.join(" → ")}`;
  };

  const employeesInThousands = financials.employees.map((e) =>
    Number((e / 1000).toFixed(0))
  );

  return [
    buildLine("売上推移", financials.revenue, "億円"),
    buildLine("営業利益推移", financials.operatingProfit, "億円"),
    buildLine("従業員数推移", employeesInThousands, "k人"),
  ].join("\n");
}

function formatReview(review: CompanyReview): string {
  if (!review.rating && review.strengths.length === 0 && review.weaknesses.length === 0) {
    return "  口コミ・評判に関する情報は見つかりませんでした。OpenWork等の口コミサイトでご確認ください。";
  }

  return [
    `  • 総合評価：${review.rating ? `${review.rating}/5.0` : "不明"}`,
    `  • 強み：${review.strengths.length ? review.strengths.join("、") : "情報なし"}`,
    `  • 改善点：${review.weaknesses.length ? review.weaknesses.join("、") : "情報なし"}`,
    `  • ワークライフバランス：${review.workLifeBalance || "情報なし"}`,
    `  • キャリア成長：${review.careerGrowth || "情報なし"}`,
  ].join("\n");
}

// モックデータベース／Claude構造化データ どちらの CompanyInfo からもレポートを生成する共通関数
function buildReportText(companyName: string, data: CompanyInfo): string {
  return `【${companyName} 企業調査レポート】

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【企業概要】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orFallback(data.overview)}

【事業内容・サービス】
${orFallback(data.business)}

【採用情報】
${orFallback(data.recruiting)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【財務分析・経営状況】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatFinancials(data.financials)}

【今後の経営戦略・注力事業】
${orFallback(data.futureStrategy)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【社風・カルチャー（口コミ分析）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatReview(data.review)}

【競合分析・差別化ポイント】
同業他社：${orFallback(data.competitors, "情報が見つかりませんでした。")}

差別化ポイント：
${orFallback(data.differentiation)}

【転職市場での評判】
${orFallback(data.evaluation)}

【求職者にとっての魅力】
${orFallback(data.appeal)}

【懸念点・注意事項】
${orFallback(data.concerns)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは公開情報を基に作成しています。
最新情報は公式サイト・決算資料でご確認ください。`;
}

// Wikipedia テキストからのレポート生成（Claude APIキー未設定・検索失敗時の最終フォールバック）
function generateFromWikipedia(companyName: string, wikipediaText: string): string {
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

function lookupCompanyDatabase(companyName: string): CompanyInfo | undefined {
  const normalizedName = aliasMap[companyName] || companyName;
  let data = companyDatabase[normalizedName];

  if (!data) {
    const key = Object.keys(companyDatabase).find(
      (k) => k.toLowerCase() === companyName.toLowerCase()
    );
    if (key) {
      data = companyDatabase[key];
    }
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { companyName?: string };
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
      } catch {
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

    const companyData = lookupCompanyDatabase(companyName);

    let searchSummary: string;
    let effectiveData: CompanyInfo | undefined = companyData;

    if (companyData) {
      // モックデータベースから取得
      searchSummary = buildReportText(companyName, companyData);
    } else {
      // Claude API + web_search でリアルタイム検索
      console.log("🤖 Claude API (web_search) で企業情報を検索中...");
      const claudeData = await searchWithClaude(companyName);

      const hasUsefulData =
        !!claudeData &&
        (claudeData.overview.length > 0 ||
          claudeData.industry.length > 0 ||
          claudeData.business.length > 0 ||
          claudeData.financials.revenue.length > 0);

      if (hasUsefulData && claudeData) {
        effectiveData = claudeData;
        searchSummary = buildReportText(companyName, claudeData);
      } else {
        // Claude API が失敗、またはJSONが空だった場合は Wikipedia を試す
        console.log("📖 Wikipedia で企業情報を検索中...");
        const wikipediaInfo = await getWikipediaInfo(companyName);
        searchSummary = generateFromWikipedia(companyName, wikipediaInfo);
      }
    }

    console.log("✅ 情報取得完了");

    const financials = effectiveData?.financials;
    const lastRevenue =
      financials && financials.revenue.length
        ? financials.revenue[financials.revenue.length - 1]
        : 0;
    const lastOperatingProfit =
      financials && financials.operatingProfit.length
        ? financials.operatingProfit[financials.operatingProfit.length - 1]
        : 0;
    const lastYear =
      financials && financials.years.length
        ? financials.years[financials.years.length - 1]
        : 0;

    const responseData = {
      id: Math.floor(Math.random() * 10000),
      company_name: companyName,
      company_name_kana: effectiveData?.overview?.substring(0, 10) || "",
      industry: effectiveData?.industry || "",
      establishment_date: effectiveData?.foundedYear
        ? `${effectiveData.foundedYear}年`
        : "",
      representative_name: effectiveData?.representative || "",
      latest_revenue_billion: lastRevenue,
      latest_revenue_year: lastYear,
      latest_profit_billion: lastOperatingProfit,
      latest_profit_year: lastYear,
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
