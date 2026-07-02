import { auth } from '@/lib/auth/server';

export const GET = async (req: Request, context: { params: Promise<Record<string, string | string[]>> }) => {
  const handler = auth.handler();
  return handler.GET!(req, context as any);
};

export const POST = async (req: Request, context: { params: Promise<Record<string, string | string[]>> }) => {
  const handler = auth.handler();
  return handler.POST!(req, context as any);
};
