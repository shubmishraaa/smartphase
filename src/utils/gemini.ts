import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function initGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function chatWithGemini(
  messages: { role: string; text: string }[],
  systemPrompt: string
): Promise<string> {
  if (!genAI) throw new Error('Gemini not initialized');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    systemInstruction: systemPrompt,
  });
  const result = await chat.sendMessage(messages[messages.length - 1].text);
  return result.response.text();
}

export async function analyzeWithGemini(prompt: string): Promise<string> {
  if (!genAI) throw new Error('Gemini not initialized');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function analyzeImagesWithGemini(
  images: { data: string; mimeType: string }[],
  prompt: string
): Promise<string> {
  if (!genAI) throw new Error('Gemini not initialized');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const parts: any[] = images.map((img) => ({
    inlineData: { data: img.data, mimeType: img.mimeType },
  }));
  parts.push({ text: prompt });
  const result = await model.generateContent(parts);
  return result.response.text();
}

export function getMockResponse(type: string): string {
  const mocks: Record<string, string> = {
    chat: 'I would recommend looking at properties in Sector 56, Gurgaon. This area has excellent connectivity to Cyber City via Golf Course Road, good schools like DPS and Ryan International nearby, and prices have appreciated 12% in the last year. Would you like me to show you some specific properties?',
    analysis: JSON.stringify({
      hiddenRisks: [
        {
          risk: 'Water seepage marks visible',
          severity: 'medium',
          detail: 'Ceiling corners show moisture patterns',
        },
      ],
      noiseAnalysis: {
        score: 6,
        sources: ['Traffic', 'Construction nearby'],
        peakHours: '8-10 AM',
      },
      constructionQuality: {
        score: 7,
        observations: ['Good tile work', 'Standard fittings'],
      },
      lightingScore: { natural: 7, artificial: 6 },
      spaceEfficiency: 7,
      investmentScore: 7,
      resaleScore: 6,
      lifestyleCompatibility: 7,
      redFlags: [
        'No covered parking visible',
        'Single elevator building',
      ],
      greenFlags: [
        'South-facing balcony',
        'Near metro station',
        'Gated community',
      ],
      verdict: 'Consider',
      verdictReason:
        'Good location and layout but some maintenance concerns need addressing before purchase.',
    }),
    negotiation: JSON.stringify({
      fairPriceMin: 7200000,
      fairPriceMax: 8500000,
      localityAvg: 8800000,
      negotiationRoom: 12,
      strategies: [
        {
          name: 'Aggressive',
          discount: 15,
          argument: 'Market has softened 8% this quarter',
          risk: 'High',
        },
        {
          name: 'Balanced',
          discount: 10,
          argument: 'Comparable units sold for 10% less recently',
          risk: 'Medium',
        },
        {
          name: 'Relationship-first',
          discount: 5,
          argument: 'Quick closure with bank-approved loan',
          risk: 'Low',
        },
      ],
    }),
    investment:
      'This property in Sector 56 shows strong fundamentals. The micro-market has seen consistent 8-10% YoY appreciation driven by proximity to Cyber City. Rental yields at 3.2% are above the Gurgaon average of 2.8%. The key risk is oversupply in adjacent sectors, but the established infrastructure here provides a moat.',
  };
  return mocks[type] || mocks.chat;
}
