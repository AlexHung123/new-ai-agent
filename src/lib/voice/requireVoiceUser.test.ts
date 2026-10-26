import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { requireVoiceUser } from './requireVoiceUser';

function request(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/itms/ai/api/voice/transcribe', {
    headers,
  });
}

describe('requireVoiceUser', () => {
  it('uses the bearer token when x-user-id names someone else', async () => {
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: 7, username: 'test-user' }, secret, {
      expiresIn: '1h',
    });
    const userId = await requireVoiceUser(
      request({
        authorization: `Bearer ${token}`,
        'x-user-id': '999',
      }),
    );
    expect(userId).toBe('7');
  });
});
