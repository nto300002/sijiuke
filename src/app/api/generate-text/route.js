import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { difficulty } = await request.json();

    // 難易度に応じた文字数範囲を設定
    let charRange;
    switch(difficulty) {
      case 'easy':
        charRange = '20〜30';
        break;
      case 'hard':
        charRange = '60〜70';
        break;
      default: // normal
        charRange = '40〜50';
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    あなたは会社の上司として、部下に業務指示を出します。
    以下の条件に従って、業務指示の文章を1つ生成してください：
    
    - 文字数は${charRange}文字
    - 5W1H（誰に、いつ、何を、どこで、なぜ、どのように）の要素を含める
    - 納品先の相手の情報を必ず含める
    - ビジネス文書として適切な丁寧な表現を使用
    
    例：「田中さん、A社の山田部長に明日15時までに第3四半期の売上レポートをメールで提出してください。グラフを含めて分かりやすく作成をお願いします。」
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return Response.json({ text });
  } catch (error) {
    console.error('Text generation error:', error);
    return Response.json({ error: "テキスト生成に失敗しました" }, { status: 500 });
  }
} 
