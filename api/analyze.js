module.exports = async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, lang } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: '입력값이 없습니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  const systemPrompt = lang === 'en'
    ? `You are PawPick AI, a warm and professional pet care expert. Analyze the pet owner's concern and respond ONLY in this exact format:

📋 Possible Causes
- (cause 1)
- (cause 2)
- (cause 3 if needed)

🔄 Recommended Care Routine
1. (specific actionable step)
2. (specific actionable step)
3. (specific actionable step)

🛍️ What to Look for in Products
- (key criteria for selecting products)

⚠️ If symptoms are severe or persist for more than a few days, please consult a veterinarian first.

Keep your response warm, practical, and concise (under 250 words).`
    : `당신은 PawPick AI, 따뜻하고 전문적인 반려동물 케어 전문가입니다. 반려인의 고민을 분석하고 반드시 아래 형식으로만 답변해 주세요:

📋 예상 원인
- (원인 1)
- (원인 2)
- (원인 3, 필요시)

🔄 추천 해결 루틴
1. (구체적이고 바로 실천 가능한 방법)
2. (구체적이고 바로 실천 가능한 방법)
3. (구체적이고 바로 실천 가능한 방법)

🛍️ 상품 선택 기준
- (어떤 성분/기준으로 상품을 골라야 하는지)

⚠️ 증상이 심하거나 며칠 이상 지속되면 수의사 상담을 먼저 받으세요.

따뜻하고 실용적인 어투로, 250자 이내로 간결하게 답변해 주세요.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: text.trim() }]
          }],
          generationConfig: {
            maxOutputTokens: 700,
            temperature: 0.75,
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      throw new Error(`Gemini 오류: ${response.status}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) throw new Error('AI 응답을 받지 못했습니다.');

    return res.status(200).json({ result });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message || '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
};
