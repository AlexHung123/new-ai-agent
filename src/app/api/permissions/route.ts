import { NextRequest, NextResponse } from 'next/server';
import { prismaSecondary } from '@/lib/postgres/db';

export async function GET(request: NextRequest) {
  try {
    // Get userId from middleware (verified from token)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Query permissions for the user
    const permissions = await prismaSecondary.$queryRawUnsafe<{ cap_permission_code: string }[]>(
      `
      SELECT cap_permission_code
      FROM cap_user cu 
      INNER JOIN cap_user_role_m curm ON cu.id = curm.cap_user_id 
      INNER JOIN cap_role_permission_m crpm ON crpm.cap_role_id = curm.cap_role_id 
      WHERE crpm.cap_permission_code IN (
        'chatSfcAgent:execute',
        'chatGuideAgent:execute',
        'chatDataAgent:execute',
        'chatSurveyAgent:execute'
      ) 
      AND cu.id = $1
      `,
      parseInt(userId)
    );

    // Extract permission codes
    const permissionCodes = permissions.map((p) => p.cap_permission_code);

    return NextResponse.json({ permissions: permissionCodes });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}
