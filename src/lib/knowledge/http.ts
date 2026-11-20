import { NextResponse } from 'next/server';
import { DochubError } from './errors';
import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

export function userIdFrom(req: Request): string | null {
  const id = req.headers.get('x-user-id')?.trim() || '';
  return id || null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { message: 'Unauthorized - Authentication required' },
    { status: 401 },
  );
}

export function jsonFromUnknownError(error: unknown): NextResponse {
  if (error instanceof DochubError) {
    return NextResponse.json(
      { message: error.message, error: error.code },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { message: DOCHUB_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}
