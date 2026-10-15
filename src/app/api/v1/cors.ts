export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function apiError(status: number, message: string, code: string) {
  return Response.json({ error: { message, type: "invalid_request_error", code } }, { status, headers: CORS });
}
