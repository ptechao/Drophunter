/**
 * AI Summary Service — generates summaries for airdrops using DeepSeek
 */
import 'dotenv/config';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const AI_ENABLED = DEEPSEEK_KEY && DEEPSEEK_KEY !== 'your-d...n';

interface AISummaryInput {
  name: string;
  protocol: string;
  chain: string;
  description: string;
}

/**
 * Generate an AI summary for an airdrop
 */
export async function generateAirdropSummary(input: AISummaryInput): Promise<string> {
  if (!AI_ENABLED) {
    return generateFallbackSummary(input);
  }

  try {
    const prompt = `你是一個加密貨幣空投分析師。請用繁體中文簡短分析以下空投項目（50-80字內），包含：
1. 項目定位
2. 空投潛力評估
3. 操作建議

項目名稱: ${input.name}
協議: ${input.protocol}
鏈: ${input.chain}
描述: ${input.description}

請直接回覆分析結果。`;

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || generateFallbackSummary(input);
  } catch (err) {
    console.error('[AI Summary] Error:', err);
    return generateFallbackSummary(input);
  }
}

/**
 * Estimate reward range using heuristics
 */
export function estimateReward(protocol: string, chain: string): string {
  const majorL2s = ['Arbitrum', 'Optimism', 'zkSync', 'StarkNet', 'Scroll', 'Linea', 'Base', 'Polygon'];
  const isMajor = majorL2s.some(l2 => protocol.includes(l2) || chain.includes(l2));
  
  if (isMajor) return '$200-1500';
  return '$50-500';
}

function generateFallbackSummary(input: AISummaryInput): string {
  return `${input.name} 是 ${input.chain} 鏈上的 ${input.protocol} 協議。根據歷史類似項目，建議使用主網帳號進行互動操作以獲取空投資格。`;
}
