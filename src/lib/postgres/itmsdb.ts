import { prismaSecondary } from '@/lib/postgres/db';

export async function executeSql(sql: string): Promise<any[]> {
  try {
    const columns: any[] = await prismaSecondary.$queryRawUnsafe(sql);
    return columns;
  } catch (error) {
    throw new Error(`SQL execution error: ${error}`);
  }
}
