module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, lang } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: '입력값이 없습니다.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  /* ── 시스템 프롬프트 ── */
  const systemPrompt = lang === 'en'
    ? `You are PawPick AI, a warm and professional pet care expert.
Analyze the pet owner's concern and respond ONLY with a valid JSON object — no markdown, no extra text.

JSON format:
{
  "analysis": "<full analysis text using the format below>",
  "tags": ["<tag1>", "<tag2>"],
  "petType": "dog" | "cat" | "both"
}

For "petType": detect whether the concern is about a dog ("dog"), cat ("cat"), or both/unknown ("both").

For "analysis", use EXACTLY this structure (each section must have AT LEAST 3 items):

📋 Possible Causes
- (cause 1 — specific and relevant)
- (cause 2 — specific and relevant)
- (cause 3 — specific and relevant)
- (cause 4 — add if relevant)

🔄 Recommended Care Routine
1. (concrete actionable step — can be done today)
2. (concrete actionable step)
3. (concrete actionable step)
4. (add if helpful)

🛍️ What to Look for in Products
- (key ingredient or selection criteria)

⚠️ If symptoms are severe or persist more than a few days, consult a veterinarian first.

For "tags", pick 2–4 items ONLY from this list:
food, wet-food, treats, skin-supplement, omega3, joint-supplement, digestive-supplement, probiotic, calming-supplement, toy, nose-work, scratcher, litter, shampoo, dental, cat-tower, kennel, harness

Warm and practical tone. Keep analysis under 400 words.`

    : `당신은 PawPick AI, 따뜻하고 전문적인 반려동물 케어 전문가입니다.
반려인의 고민을 분석하고, 반드시 아래 형식의 유효한 JSON 객체로만 답변하세요. 마크다운이나 다른 텍스트는 절대 포함하지 마세요.

JSON 형식:
{
  "analysis": "<아래 형식의 전체 분석 텍스트>",
  "tags": ["<태그1>", "<태그2>"],
  "petType": "dog" | "cat" | "both"
}

"petType"은 고민이 강아지에 관한 것이면 "dog", 고양이에 관한 것이면 "cat", 불명확하거나 둘 다면 "both"로 설정하세요.

"analysis"는 반드시 이 구조를 따르세요 (각 항목 최소 3개 이상):

📋 예상 원인
- (원인 1 — 구체적이고 관련성 높게)
- (원인 2 — 구체적이고 관련성 높게)
- (원인 3 — 구체적이고 관련성 높게)
- (원인 4 — 해당될 경우 추가)

🔄 추천 해결 루틴
1. (오늘 바로 실천 가능한 구체적 방법)
2. (구체적 방법)
3. (구체적 방법)
4. (도움이 되는 경우 추가)

🛍️ 상품 선택 기준
- (어떤 성분/기준으로 상품을 골라야 하는지)

⚠️ 증상이 심하거나 며칠 이상 지속되면 수의사 상담을 먼저 받으세요.

"tags"는 아래 목록에서만 2~4개 선택하세요:
사료, 습식사료, 간식, 피부영양제, 오메가3, 관절영양제, 소화영양제, 유산균, 진정영양제, 장난감, 노즈워크, 스크래쳐, 모래, 샴푸, 치아, 캣타워, 켄넬, 하네스

따뜻하고 실용적인 어투로 작성해 주세요.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: text.trim() }] }],
          generationConfig: {
            maxOutputTokens: 2500,
            temperature: 0.7,
            responseMimeType: 'application/json',
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      if (response.status === 429) throw new Error('AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
      if (response.status === 403) throw new Error('API 키가 유효하지 않습니다. Vercel 환경변수를 확인해 주세요.');
      throw new Error(`AI 서비스 오류가 발생했습니다. (${response.status})`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('AI 응답을 받지 못했습니다.');

    // JSON 파싱 (잘림 대비 fallback 포함)
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // JSON이 잘린 경우: 정규식으로 analysis / tags 추출
      const aMatch = rawText.match(/"analysis"\s*:\s*"([\s\S]+?)"\s*[,}]/);
      const tMatch = rawText.match(/"tags"\s*:\s*\[([\s\S]*?)\]/);

      const analysisRaw = aMatch ? aMatch[1] : rawText;
      const analysisText = analysisRaw
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      const tags = tMatch
        ? (tMatch[1].match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, ''))
        : [];

      const ptMatch = rawText.match(/"petType"\s*:\s*"([^"]+)"/);
      const petType = ptMatch ? ptMatch[1] : 'both';

      parsed = { analysis: analysisText, tags, petType };
    }

    return res.status(200).json({
      result: parsed.analysis || rawText,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      petType: parsed.petType || 'both',
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message || '분석 중 오류가 발생했습니다.' });
  }
};
