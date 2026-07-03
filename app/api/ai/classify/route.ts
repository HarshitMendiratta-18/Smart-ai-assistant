import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/gemini';

export async function POST(req: NextRequest) {
  try {
    const { description, imageUrl } = await req.json();
    
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required for classification.' },
        { status: 400 }
      );
    }

    const classification = await geminiService.classifyComplaint(description, imageUrl);
    
    return NextResponse.json(classification);
  } catch (error: any) {
    console.error('Classification endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during AI analysis.' },
      { status: 500 }
    );
  }
}
