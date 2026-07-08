export const dynamic = "force-dynamic";

interface CompanyInfo {
  overview: string;
  business: string;
  recruiting: string;
  culture: string;
  evaluation: string;
  appeal: string;
  concerns: string;
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
    console.log("Wikipedia API エラー:", error);
    return "";
  }
}

// 高質なモックデータベース（複数企業対応）
const companyDatabase: Record<string, CompanyInfo> = {
  ソニー: {
    overview:
      "ソニー株式会社は、日本を代表する大手電機メーカー。1946年設立。東京都港区に本社。従業員数は約11万人。世界有数の総合電機メーカーであり、音声・映像・ゲーム・金融など多岐にわたる事業を展開。",
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
  },
  トヨタ自動車: {
    overview:
      "トヨタ自動車株式会社は、世界最大級の自動車メーカー。1937年設立。愛知県豊田市に本社。従業員数は約37万人（グループ）。ハイブリッド車などの環境対応車で業界をリード。",
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
  },
  日本銀行: {
    overview:
      "日本銀行は日本の中央銀行。1882年設立。東京都中央区に本店。正職員数約3,000人。金融政策の実行、銀行券の発行などを担当する政策機関。",
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
  },
};

// 企業データを生成
function generateCompanyReport(
  companyName: string,
  wikipediaText: string
): string {
  const data =
    companyDatabase[companyName] ||
    companyDatabase[
      Object.keys(companyDatabase).find(
        (key) => key.toLowerCase() === companyName.toLowerCase()
      ) || ""
    ];

  // データベースにない場合は Wikipedia テキストから生成
  if (!data) {
    return generateFromWikipedia(companyName, wikipediaText);
  }

  return `【${companyName} 企業調査レポート】

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【企業概要】
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.overview}

【事業内容・サービス】
${data.business}

【採用情報】
${data.recruiting}

【社風・カルチャー】
${data.culture}

【転職市場での評判】
${data.evaluation}

【求職者にとっての魅力】
${data.appeal}

【懸念点・注意事項】
${data.concerns}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは公開情報を基に作成しています。
最新情報は公式サイトでご確認ください。`;
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
- 転職サイト（OpenWork、Wantedly等）
- 企業紹介サイト（Crunchbase等）

【採用情報】
最新の採用情報は企業の採用ページをご確認ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
本レポートは公開情報を基に作成しています。`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const companyName = body.companyName || "";

  if (!companyName.trim()) {
    return Response.json({ error: "企業名を入力してください" }, { status: 400 });
  }

  try {
    console.log("📝 企業名:", companyName);
    console.log("🔍 企業情報を検索中...");

    // Wikipedia から情報を取得
    const wikipediaInfo = await getWikipediaInfo(companyName);

    console.log("✅ 情報取得完了");

    const searchSummary = generateCompanyReport(companyName, wikipediaInfo);

    return Response.json({
      id: Math.floor(Math.random() * 10000),
      company_name: companyName,
      search_summary: searchSummary,
      report_status: "completed",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "企業調査に失敗しました";
    console.error("詳細:", errorMessage);

    return Response.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
