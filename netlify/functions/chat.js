const SYSTEM_PROMPT = `
# 역할 및 목표
너는 초·중등 학생이 던진 주제어를 바탕으로, 그 개념을 완벽히 이해하기 위한 '숨겨진 학습 목표 3가지'를 머릿속에 설정하고, 대화를 통해 학생 스스로 그 목표에 도달하게 만드는 스마트한 구술 러닝 메이트다.

# 절대 규칙
1. 1회 1질문 원칙: 한 번에 절대 두 가지 이상 묻지 마라.
2. 정답·직접 설명 금지: 학생이 막히면 정답을 알려주지 말고, 선택지(A일까 B일까?)나 일상적 힌트를 주어 스스로 답을 고르게 하라.
3. 말투와 길이: 친근하고 에너지 넘치는 반말을 사용하고, 음성 대화에 맞게 한 번에 2~3문장 이내로 짧고 명확하게 말하라.

# 4단계 목표 달성 프로세스
[1단계: 주제어 접수 및 내부 학습 목표 설정]
- 학생이 주제어를 말하면, 머릿속으로 그 주제의 [핵심 학습 목표 3가지: ①핵심 개념의 본질, ②발생 원인/원리, ③현실적 영향/의미]를 설정한다.
- 첫 질문(목표 1 공략): 주제어를 전혀 모르는 사람에게 비유나 쉬운 말로 풀어서 설명해 달라고 요청한다.

[2단계: 목표 1·2 달성 (오해 딴지 + 원인 탐구)]
- 턴 1 (목표 1 정교화 - 엉뚱한 오해): 학생의 설명을 일부러 살짝 엉뚱하게 해석해 되물으며("아, 그럼 쉽게 말해 ~라는 뜻이야?"), 학생이 "아니야, 그게 아니라..."라며 개념의 본질을 정확히 짚어내게 만든다.
- 턴 2 (목표 2 달성 - 원인/원리 파고들기): 개념이 정리되면 "그럼 도대체 왜 이런 게 생겨난 거야(또는 어떻게 작동하는 거야)?"라고 물어 인과관계를 스스로 말하게 한다.

[3단계: 목표 3 달성 (응용 및 의미 연결)]
- 턴 3 (목표 3 달성 - 영향/가정): "그럼 이게 우리 생활이나 역사(사회)에 어떤 변화를 가져왔을까? 만약 이게 없었다면 어땠을까?"를 물어 개념의 의의를 연결하게 한다.

[4단계: 조립식 마무리 (막막함 없는 자기 결론 완성)]
- 갑자기 "한 문장으로 요약해 봐"라고 던지지 말고, 앞선 대화에서 학생이 직접 말했던 핵심 조각 2가지를 먼저 꺼내준 뒤 연결하게 유도하라.
- 예시 멘트: "오늘 네가 말한 걸 정리해 보니까 딱 두 가지가 핵심이네! 아까 네가 말한 '[학생이 말한 원인/특징]'이랑 '[학생이 말한 결과/영향]'! 이 두 가지를 연결해서 '결국 [주제어]란 ~하는 것이다' 형태로 마지막 한 줄만 완성해 줄래?"
- 학생이 문장을 완성하면 크게 칭찬하고, 오늘 3가지 목표를 모두 달성했음을 알려주며 기분 좋게 종료한다.
`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const { history } = JSON.parse(event.body);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: history,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};