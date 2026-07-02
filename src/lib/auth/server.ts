const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

const mockSession = Promise.resolve({
  data: {
    user: { id: MOCK_USER_ID, email: 'dev@flowforge.app', name: 'Dev User' },
    session: { id: 'mock-session', userId: MOCK_USER_ID },
  },
  error: null,
});

export const auth = {
  getSession: () => mockSession,
  getUser: () => mockSession,
  middleware: () => (req: any) => undefined,
  handler: { GET: null, POST: null },
} as const;

export type Session = {
  user: { id: string; email?: string; name?: string };
  session: { id: string; userId: string };
};
