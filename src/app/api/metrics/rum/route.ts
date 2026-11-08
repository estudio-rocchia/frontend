import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    return "http://127.0.0.1:3000";
  }
  return base.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  const body = await request.arrayBuffer();
  const url = `${getBackendBaseUrl()}/metrics/rum`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      body,
    });

    if (upstream.ok) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: upstream.status });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(null, { status: 503 });
  }
}
