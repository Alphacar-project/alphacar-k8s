// app/api/[...path]/route.ts
// Next.js API Route - 클라이언트 사이드 API 요청을 백엔드로 프록시
import { NextRequest, NextResponse } from 'next/server';

// 백엔드 서비스 매핑
const getBackendUrl = (path: string): string | null => {
  // Main Backend (포트 3002)
  // 백엔드가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
  if (
    path.startsWith('main') ||
    path.startsWith('brands') ||
    path.startsWith('sales') ||
    path.startsWith('history') ||
    path.startsWith('favorites') ||
    path.startsWith('recent-views') ||
    path.startsWith('cars') ||
    path.startsWith('review-analysis') ||
    path.startsWith('makers') ||
    path.startsWith('models') ||
    path.startsWith('base-trims') ||
    path.startsWith('trims') ||
    path.startsWith('log-view')
  ) {
    return `http://main-backend.apc-be-ns.svc.cluster.local:3002/api/${path}`;
  }

  // Quote Backend (포트 3003)
  if (
    path.startsWith('vehicles') ||
    path.startsWith('estimate') ||
    path.startsWith('quote')
  ) {
    // vehicles/makers, vehicles/models, vehicles/base-trims, vehicles/trims는 main-backend로
    // main-backend가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
    if (
      path.startsWith('vehicles/makers') ||
      path.startsWith('vehicles/models') ||
      path.startsWith('vehicles/base-trims') ||
      path.startsWith('vehicles/trims')
    ) {
      return `http://main-backend.apc-be-ns.svc.cluster.local:3002/api/${path.replace('vehicles/', '')}`;
    }
    // quote-backend는 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
    // path가 'vehicles/detail'이면 '/api/vehicles/detail'로 전달
    console.log(`[API Proxy] Quote Backend로 라우팅: path=${path}, 최종 URL=http://quote-backend.apc-be-ns.svc.cluster.local:3003/api/${path}`);
    return `http://quote-backend.apc-be-ns.svc.cluster.local:3003/api/${path}`;
  }

  // Mypage Backend (포트 3006)
  // 백엔드가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
  if (path.startsWith('mypage') || path.startsWith('auth')) {
    return `http://mypage-backend.apc-be-ns.svc.cluster.local:3006/api/${path}`;
  }

  // Search Backend (포트 3007)
  // 백엔드가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
  if (path.startsWith('search')) {
    return `http://search-backend.apc-be-ns.svc.cluster.local:3007/api/${path}`;
  }

  // Community Backend (포트 3005)
  // 백엔드가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
  if (path.startsWith('community')) {
    return `http://community-backend.apc-be-ns.svc.cluster.local:3005/api/${path}`;
  }

  // News Backend (포트 3008)
  // 백엔드가 setGlobalPrefix('api')를 사용하고, 컨트롤러는 @Controller('drive')를 사용하므로 /api/drive로 변환
  if (path.startsWith('news')) {
    const drivePath = path.replace('news', 'drive');
    return `http://news-backend.apc-be-ns.svc.cluster.local:3008/api/${drivePath}`;
  }

  // AI Chat Backend (포트 4000)
  // 백엔드가 setGlobalPrefix('api')를 사용하므로 /api prefix 추가
  if (path.startsWith('chat')) {
    return `http://aichat-backend.apc-be-ns.svc.cluster.local:4000/api/${path}`;
  }

  return null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  console.log(`[API Proxy] GET /api/${path}`);
  
  const backendUrl = getBackendUrl(path);

  if (!backendUrl) {
    console.error(`[API Proxy] No backend URL found for path: ${path}`);
    return NextResponse.json(
      { error: 'API endpoint not found', path },
      { status: 404 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;
    console.log(`[API Proxy] Proxying GET to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authorization 헤더 전달
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
      // Next.js 서버 사이드에서 fetch할 때는 timeout 설정
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend returned ${response.status} for ${url}`);
      // 404인 경우에도 에러 메시지 반환
      if (response.status === 404) {
        const errorText = await response.text().catch(() => 'Not Found');
        console.error(`[API Proxy] 404 Error: ${errorText}`);
      }
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API Proxy] Error proxying to ${backendUrl}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message, backendUrl },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  console.log(`[API Proxy] POST /api/${path}`);
  
  const backendUrl = getBackendUrl(path);

  if (!backendUrl) {
    console.error(`[API Proxy] No backend URL found for path: ${path}`);
    return NextResponse.json(
      { error: 'API endpoint not found', path },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;
    console.log(`[API Proxy] Proxying POST to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[API Proxy] Backend returned ${response.status} for ${url}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API Proxy] Error proxying to ${backendUrl}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message, backendUrl },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const backendUrl = getBackendUrl(path);

  if (!backendUrl) {
    return NextResponse.json(
      { error: 'API endpoint not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API Proxy] Error proxying to ${backendUrl}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const backendUrl = getBackendUrl(path);

  if (!backendUrl) {
    return NextResponse.json(
      { error: 'API endpoint not found' },
      { status: 404 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API Proxy] Error proxying to ${backendUrl}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

