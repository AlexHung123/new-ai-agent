import configManager from '@/lib/config';
import {
  isForbiddenConfigKey,
  publicConfigValues,
} from '@/lib/config/publicConfig';
import { NextRequest, NextResponse } from 'next/server';

type SaveConfigBody = {
  key: string;
  value: string;
};

export const GET = async (req: NextRequest) => {
  try {
    const values = publicConfigValues(
      configManager.getCurrentConfig() as Record<string, unknown>,
    );
    const fields = configManager.getUIConfigSections();

    return NextResponse.json({
      values,
      fields,
    });
  } catch (err) {
    console.error('Error in getting config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body: SaveConfigBody = await req.json();

    if (isForbiddenConfigKey(body.key)) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!body.key || !body.value) {
      return Response.json(
        {
          message: 'Key and value are required.',
        },
        {
          status: 400,
        },
      );
    }

    configManager.updateConfig(body.key, body.value);

    return Response.json(
      {
        message: 'Config updated successfully.',
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('Error in getting config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
