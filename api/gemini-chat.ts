import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatMessage = {
  role: string;
  text: string;
};

type VercelRequest = {
  method?: string;
  body?: {
    messages?: ChatMessage[];
    systemPrompt?: string;
  };
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable' });
    return;
  }

  const messages = req.body?.messages ?? [];
  const systemPrompt = req.body?.systemPrompt ?? 'You are SmartSpace, a practical Indian real estate advisor.';
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage?.text) {
    res.status(400).json({ error: 'Missing message text' });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const chat = model.startChat({
    history: messages.slice(0, -1).map((message) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    })),
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessage(lastMessage.text);
  res.status(200).json({ text: result.response.text() });
}
