import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';

const MODEL_MAP: Record<string, string> = {
  'llama-3.3-70b': 'llama-3.3-70b-versatile',
  'deepseek-r1': 'deepseek-r1-distill-llama-70b',
  'gemini-2.0-flash': 'llama-3.3-70b-versatile',
  'custom-model': 'llama-3.3-70b-versatile',
};

const SYSTEM_PROMPT = `You are Beesto AI, an AI-powered web development IDE assistant. Your PRIMARY purpose is to CREATE ACTUAL FILES and BUILD REAL WEBSITES/APPS.

CRITICAL: You are NOT a chatbot. You are a CODE GENERATOR. When users ask you to build something, you MUST output actual code files.

## How to respond:

When the user asks you to build/create something, you MUST respond with actual file code using this format:

\`\`\`filename:path/to/file.tsx
// actual code here
\`\`\`

For example, if user says "build me a coffee shop website", respond with ACTUAL FILES like:

\`\`\`filename:src/app/page.tsx
"use client";
// Full React component code for the homepage
\`\`\`

\`\`\`filename:src/components/Hero.tsx
// Hero section component
\`\`\`

\`\`\`filename:src/components/Menu.tsx
// Menu component with coffee items
\`\`\`

## Rules:
1. ALWAYS output complete, working code files
2. Use the filename:path/to/file format for EVERY code block
3. Create ALL necessary files for a complete, working app
4. Use React/Next.js with Tailwind CSS
5. Make the designs beautiful, modern, and professional
6. NEVER just describe what to do - WRITE THE ACTUAL CODE
7. Include all imports and exports
8. Make components interactive and responsive

## Tech Stack:
- Next.js 15 (App Router)
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons

When user says something like "build me a website for X" or "create an app for Y", you MUST output multiple complete code files that form a working application. DO NOT give instructions or descriptions - GIVE CODE.`;


export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'llama-3.3-70b', temperature = 0.7, customApiKey } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isCustomModel = model === 'custom-model';
    const apiKey = isCustomModel && customApiKey ? customApiKey : process.env.GROQ_API_KEY!;
    
    if (isCustomModel && !customApiKey) {
      return new Response(
        JSON.stringify({ error: 'Custom API key is required for Your Model' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const groq = new Groq({ apiKey });
    const groqModel = MODEL_MAP[model] || 'llama-3.3-70b-versatile';

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const messagesWithSystem = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...formattedMessages,
    ];

    const stream = await groq.chat.completions.create({
      model: groqModel,
      messages: messagesWithSystem,
      temperature,
      max_tokens: 8192,
      top_p: 0.9,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
