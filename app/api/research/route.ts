import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

async function getCompanyReportFromGemini(companyName: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      maxOutputTokens: 2000,
    }
  });

  const prompt = `「${companyName}」という企業について、求職者向けの調査レポートを日本語で作成してください。

以下の情報を含めてください：
- 企業概要（業種、事業内容、設立年など）
- 事業内容・サービス
- 企業規模（従業員数、売上など）
- 採用情報・人材採用の積極性
- 社風・カルチャー・働き方
- 給与・福利厚生
- 転職市場での評判
- 求職者にとっての魅力・メリット
- 懸念点・デメリット（あれば）

簡潔で実践的な内容でお願いします。各項目は見出しを付けて整理してください。`;

  console.log("🔍 Gemini API で企業情報を検索中...");

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini からのレスポンスが空です");
  }

  return text;
}

export async function POST(request: Request) {
  const body = await request.json();
  const companyName = body.companyName || "";

  if (!companyName.trim()) {
    return Response.json({ error: "企業名を入力してください" }, { status: 400 });
  }

  try {
    console.log("📝 企業名:", companyName);

    const searchSummary = await getCompanyReportFromGemini(companyName);

    return Response.json({
      id: Math.floor(Math.random() * 10000),
      company_name: companyName,
      search_summary: searchSummary,
      report_status: "completed",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "企業調査に失敗しました";
    console.error("詳細:", errorMessage);

    return Response.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
