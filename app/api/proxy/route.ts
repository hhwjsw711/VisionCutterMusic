import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for better timeout handling

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      },
    });

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      console.error(`Proxy fetch failed: ${response.status} for ${url}`);
      return new NextResponse(
        JSON.stringify({ error: `Failed to fetch: ${response.status}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300', // Cache for 5 min only
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = error instanceof Error && error.name === 'AbortError';

    return new NextResponse(
      JSON.stringify({ error: isTimeout ? 'Request timeout' : errorMessage }),
      {
        status: isTimeout ? 504 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
