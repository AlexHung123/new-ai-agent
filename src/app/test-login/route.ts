import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const TEST_USER_ID = 1;

function isTestLoginEnabled() {
  if (process.env.ENABLE_TEST_LOGIN === 'false') {
    return false;
  }
  if (process.env.ENABLE_TEST_LOGIN === 'true') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

/**
 * Dev/test shortcut that issues a JWT for user id 1 and sends
 * the browser into the existing token login flow.
 * Disabled in production unless ENABLE_TEST_LOGIN=true.
 */
export async function GET(request: NextRequest) {
  if (!isTestLoginEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const secret = process.env.JWT_SECRET || 'secret';
  const token = jwt.sign(
    {
      id: TEST_USER_ID,
      username: 'test-user',
      sessionId: 'test-login',
    },
    secret,
    { expiresIn: '24h' },
  );

  const basePath = request.nextUrl.basePath || '/itms/ai';
  const redirectUrl = new URL(`${basePath}/agents`, request.nextUrl.origin);
  redirectUrl.searchParams.set('token', token);

  return NextResponse.redirect(redirectUrl);
}
