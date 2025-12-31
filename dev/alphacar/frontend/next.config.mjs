/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  async rewrites() {
    return [
      // ----------------------------------------------------
      // [우선순위 최상단] MAIN SERVICE - 직접 경로
      // 클라이언트 사이드 API 호출을 위해 /main, /brands 등을 먼저 처리
      // ----------------------------------------------------
      {
        source: '/main/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/main/:path*',
      },
      {
        source: '/brands',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/brands',
      },
      {
        source: '/sales/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/sales/:path*',
      },

      // ----------------------------------------------------
      // [AI CHAT SERVICE] - Traefik을 통해 4000번 포트로 연결
      // ----------------------------------------------------
      {
        source: '/api/chat/:path*',
        // Traefik의 /api/chat 라우팅 규칙에 매칭되도록 보냄
        destination: 'http://traefik:9090/api/chat/:path*',
      },

      // ----------------------------------------------------
      // ★ [MAIN SERVICE] (차량 상세 정보)
      // ----------------------------------------------------
      

      // 1. [차량 상세 정보]
      {
        source: '/api/vehicles/detail',
        // Traefik의 /api/vehicles/detail 라우팅 규칙 매칭
        destination: 'http://traefik:9090/api/vehicles/detail',
      },
      
      // [견적 페이지용] /api/vehicles/* → Istio VirtualService에서 처리
      // {
      //   source: '/api/vehicles/makers',
      //   destination: 'http://main-backend:3002/api/makers',
      // },
      // {
      //   source: '/api/vehicles/models',
      //   destination: 'http://main-backend:3002/api/models',
      // },
      // {
      //   source: '/api/vehicles/base-trims',
      //   destination: 'http://main-backend:3002/api/base-trims',
      // },
      // {
      //   source: '/api/vehicles/trims',
      //   destination: 'http://main-backend:3002/api/trims',
      // },

      // ----------------------------------------------------
      // ★ [QUOTE SERVICE] (견적 및 기타 차량 정보)
      // ----------------------------------------------------

      // 2. [나머지 차량 관련]
      {
        source: '/api/vehicles/:path*',
        destination: 'http://traefik:9090/api/vehicles/:path*',
      },

      // 2. [견적 저장 및 목록]
      {
        source: '/api/estimate/:path*',
        destination: 'http://traefik:9090/api/estimate/:path*',
      },

      // ✅ 3. [최근 본 차량 (History)] - Istio VirtualService에서 처리
      // {
      //   source: '/api/history/:path*',
      //   destination: 'http://traefik:9090/api/history/:path*',
      // },

      // 3. [이전 API 호환성 확보]
      {
        source: '/api/quote/:path*',
        destination: 'http://traefik:9090/api/quote/:path*',
      },

      // ----------------------------------------------------
      // [MAIN SERVICE - 일반 데이터]
      // 클라이언트 사이드 API 호출을 위해 rewrites 활성화
      // Istio VirtualService와 함께 작동 (서버 사이드 + 클라이언트 사이드)
      // ----------------------------------------------------

      // 4. [메인 데이터 처리 - API 경로]
      // /api/main도 지원 (기존 호환성)
      {
        source: '/api/main/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/main/:path*',
      },

      // 4-1. [브랜드 목록 - API 경로]
      // /api/brands도 지원 (기존 호환성)
      {
        source: '/api/brands',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/brands',
      },

      // 4-2. [판매 순위]
      {
        source: '/api/sales/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/sales/:path*',
      },

      // 5. [최근 본 차량 (History)]
      {
        source: '/api/history/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/history/:path*',
      },

      // 5-1. [찜하기 기능]
      {
        source: '/api/favorites/:path*',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/favorites/:path*',
      },

      // 5-2. [최근 본 차량]
      {
        source: '/api/recent-views',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/recent-views',
      },

      // 5-3. [리뷰 분석]
      {
        source: '/api/review-analysis',
        destination: 'http://main-backend.apc-be-ns.svc.cluster.local:3002/review-analysis',
      },

      // ----------------------------------------------------
      // [OTHER SERVICES]
      // ----------------------------------------------------

      // 6. [커뮤니티] - 주석 처리 (Community Backend 없음, Istio VirtualService에서 처리)
      // {
      //   source: '/api/community/:path*',
      //   destination: 'http://traefik:9090/api/community/:path*',
      // },

      // 7. [마이페이지] - 주석 처리 (MyPage Backend 없음, Istio VirtualService에서 처리)
      // {
      //   source: '/api/mypage/:path*',
      //   destination: 'http://traefik:9090/api/mypage/:path*',
      // },
      
      // 7-1. [인증 (로그인)] - 주석 처리 (MyPage Backend 없음, Istio VirtualService에서 처리)
      // {
      //   source: '/api/auth/:path*',
      //   destination: 'http://traefik:9090/api/auth/:path*',
      // },
      
      // 8. [검색]
      {
        source: '/api/search/:path*',
        destination: 'http://traefik:9090/api/search/:path*',
      },
    ];
  },
};

export default nextConfig;
