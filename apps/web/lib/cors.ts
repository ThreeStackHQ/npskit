import { NextResponse } from "next/server";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export function corsOk(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => {
    response.headers.set(k, v);
  });
  return response;
}

export function corsJson(
  data: unknown,
  status = 200
): NextResponse {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}
