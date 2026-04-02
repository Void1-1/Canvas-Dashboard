import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import { getConversation } from '@/lib/canvas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;
  const id = parseInt(conversationId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  try {
    const conversation = await getConversation(userId, id);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to fetch conversation', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
