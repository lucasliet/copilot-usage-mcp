import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.github.com/copilot_internal/user', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === 'token valid-token') {
      return HttpResponse.json({
        copilot_plan: 'Business',
        chat_enabled: true,
        quota_snapshots: { premium_interactions: { unlimited: true }, chat: { unlimited: true }, completions: { unlimited: true } },
        quota_reset_date: '2025-01-01T00:00:00Z'
      });
    }
    if (auth === 'token invalid-token') {
        return new HttpResponse('{"message":"Bad credentials"}', {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return new HttpResponse(null, { status: 500 });
  }),
];
