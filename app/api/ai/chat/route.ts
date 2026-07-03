import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/gemini';

export async function POST(req: NextRequest) {
  try {
    const { query, history, context } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required for AI chat.' },
        { status: 400 }
      );
    }

    const chatHistory = history || [];
    const contextChunks = context || [];

    // Invoke Gemini model RAG completions
    const responseText = await geminiService.chatWithKnowledge(
      chatHistory,
      query,
      contextChunks
    );

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during conversational RAG chat.' },
      { status: 500 }
    );
  }
}
