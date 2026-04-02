import { NextResponse } from 'next/server';
import { hasAnyUsers } from '@/lib/users';

export async function GET() {
  const hasUsers = hasAnyUsers();
  return NextResponse.json({ hasUsers });
}
