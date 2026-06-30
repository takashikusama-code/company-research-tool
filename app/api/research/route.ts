import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const body = await request.json();
  const companyName = body.companyName || "";

  if (!companyName.trim()) {
    return Response.json({ error: "企業名を入力してください" }, { status: 400 });
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      tools: [
        {
          name: "search_web",
          description: "Search the web for company information",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
            },
            required: ["query"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: `企業「${companyName}」について、求職者向けの企業調査レポートを作成してください。

以下の形式で出力してください：

【求職者向けの短め紹介文】
150～250文字程度で、求職者にそのまま伝えられる自然な文章

【会社概要】
- 企業名
- 所在地
- 設立年
- 代表者名
- 従業員数
- 事業内容（簡潔に）

【事業内容】
主力事業の詳細説明

【採用・求人情報】
募集職種、仕事内容、働き方など

【社風・カルチャー】
会社の価値観、働く環境、チーム構成

【代表者・経営陣】
代表者名、経歴、経営理念、考え方

【求職者に伝える魅力】
事業の魅力、成長環境、社風、代表の魅力など

【向いていそうな人】
どんな志向の求職者に合いそうか

【確認した方がよい点】
公開情報では分からない点や企業に確認すべき点

【参考情報源】
情報の出所を記載

詳細で実践的なレポートを作成してください。`,
        },
      ],
    });

    // Extract text response
    let reportText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        reportText = block.text;
      }
    }

    return Response.json({
      id: Math.floor(Math.random() * 10000),
      company_name: companyName,
      search_summary: reportText,
      report_status: "completed",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "企業調査に失敗しました",
      },
      { status: 500 }
    );
  }
}
