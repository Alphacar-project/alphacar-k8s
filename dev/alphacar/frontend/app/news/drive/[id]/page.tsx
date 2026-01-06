// app/news/drive/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

// 드라이브 코스 데이터
const DRIVE_COURSES = [
  {
    id: 1,
    title: "남양주 팔당호",
    subtitle: "팔당호뷰 따라 달리는 힐링 드라이브",
    region: "경기 남양주",
    distance: "약 30km",
    duration: "왕복 약 1시간",
    description: `서울에서 가깝게 나갈 수 있는 대표 힐링 코스입니다.
팔당호를 따라 달리면서 탁 트인 강뷰를 즐길 수 있고,
카페·맛집도 많아서 당일치기 코스로 좋습니다.`,
    lat: 37.5500,
    lng: 127.3000,
    waypoints: [
      { name: "팔당호 출발점", lat: 37.5500, lng: 127.3000 },
      { name: "팔당호 중간 지점", lat: 37.5600, lng: 127.3100 },
      { name: "팔당호 도착점", lat: 37.5700, lng: 127.3200 },
    ],
  },
  {
    id: 2,
    title: "양평 두물머리/세미원",
    subtitle: "강을 끼고 달리는 감성 드라이브",
    region: "경기 양평",
    distance: "약 40km",
    duration: "왕복 약 1시간 30분",
    description: `서울 근교에서 자연을 느끼고 싶다면, 아름다운 풍경과 함께 드라이브를 즐길 수 있습니다.
수령 400년의 느티나무와 황포돛단배로 유명한 두물머리와 연꽃 정원 세미원을 함께 즐길 수 있는 코스입니다.`,
    lat: 37.5300,
    lng: 127.5000,
    waypoints: [
      { name: "두물머리 출발점", lat: 37.5300, lng: 127.5000 },
      { name: "세미원", lat: 37.5400, lng: 127.5100 },
      { name: "두물머리 도착점", lat: 37.5500, lng: 127.5200 },
    ],
  },
  {
    id: 3,
    title: "북한산-우이천 드라이브",
    subtitle: "산과 물을 동시에 즐기는 코스",
    region: "서울/경기",
    distance: "약 25km",
    duration: "왕복 약 1시간",
    description: `북한산 능선을 보며 달리다가 우이천을 따라 내려오는 드라이브입니다.
주말에 가볍게 나들이하기 좋고, 중간중간 들를 수 있는 맛집도 많습니다.`,
    lat: 37.6500,
    lng: 127.0000,
    waypoints: [
      { name: "북한산 입구", lat: 37.6500, lng: 127.0000 },
      { name: "우이천 중간", lat: 37.6400, lng: 127.0100 },
      { name: "우이천 하류", lat: 37.6300, lng: 127.0200 },
    ],
  },
  {
    id: 4,
    title: "북악스카이웨이",
    subtitle: "서울 도심 야경 맛집 코스",
    region: "서울 종로/성북",
    distance: "약 15km",
    duration: "왕복 약 40분",
    description: `서울 시내와 한강, 남산까지 한눈에 담는 최고의 야경 명소입니다.
팔각정에서 쉬어가며 서울의 아름다운 야경을 감상할 수 있습니다.`,
    lat: 37.6000,
    lng: 126.9500,
    waypoints: [
      { name: "북악스카이웨이 입구", lat: 37.6000, lng: 126.9500 },
      { name: "팔각정 전망대", lat: 37.6100, lng: 126.9600 },
      { name: "북악스카이웨이 종점", lat: 37.6200, lng: 126.9700 },
    ],
  },
  {
    id: 5,
    title: "남산순환도로",
    subtitle: "N서울타워로 이어지는 야경 코스",
    region: "서울 중구",
    distance: "약 12km",
    duration: "왕복 약 35분",
    description: `N서울타워로 이어지는 길을 따라 드라이브하며 서울의 야경을 즐길 수 있습니다.
서울의 상징적인 야경 코스로, 도심의 불빛이 아름답게 펼쳐집니다.`,
    lat: 37.5500,
    lng: 126.9800,
    waypoints: [
      { name: "남산 입구", lat: 37.5500, lng: 126.9800 },
      { name: "N서울타워", lat: 37.5510, lng: 126.9880 },
      { name: "남산 종점", lat: 37.5520, lng: 126.9900 },
    ],
  },
  {
    id: 6,
    title: "한강 야경 코스",
    subtitle: "잠수교 → 반포대교 → 세빛섬",
    region: "서울 강남/서초",
    distance: "약 20km",
    duration: "왕복 약 50분",
    description: `잠수교 → 반포대교 → 세빛섬으로 이어지는 환상적인 야경 코스입니다.
노들섬과 양화대교를 따라 망원한강공원으로 이어지는 코스도 좋습니다.`,
    lat: 37.5200,
    lng: 126.9500,
    waypoints: [
      { name: "잠수교", lat: 37.5200, lng: 126.9500 },
      { name: "반포대교", lat: 37.5150, lng: 126.9600 },
      { name: "세빛섬", lat: 37.5100, lng: 126.9700 },
    ],
  },
  {
    id: 7,
    title: "파주",
    subtitle: "마장호수 출렁다리, 헤이리 예술마을",
    region: "경기 파주",
    distance: "약 50km",
    duration: "왕복 약 2시간",
    description: `마장호수 출렁다리, 헤이리 예술마을 등 독특하고 예쁜 곳들이 많아 드라이브 코스로 인기입니다.
예술과 자연이 어우러진 특별한 경험을 할 수 있습니다.`,
    lat: 37.7500,
    lng: 126.7800,
    waypoints: [
      { name: "헤이리 예술마을", lat: 37.7500, lng: 126.7800 },
      { name: "마장호수 출렁다리", lat: 37.7600, lng: 126.7900 },
      { name: "파주 도착점", lat: 37.7700, lng: 126.8000 },
    ],
  },
];

export default function DriveCoursePage() {
  const params = useParams();
  const id = Number(params.id);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const course = DRIVE_COURSES.find((c) => c.id === id);

  useEffect(() => {
    if (!course || !mapRef.current) return;

    // 기존 스크립트 제거
    const existingScript = document.querySelector('script[src*="maps"]');
    if (existingScript) {
      existingScript.remove();
    }

    // 카카오맵 API 키 (환경변수에서만 가져오기)
    const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

    // API 키 확인
    if (!KAKAO_MAP_API_KEY) {
      console.error("카카오맵 API 키가 설정되지 않았습니다.");
      return;
    }

    // 카카오맵 API 로드
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;

    script.onerror = () => {
      console.error("카카오맵 API 스크립트 로드 실패");
    };

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = mapRef.current;
          if (!container) {
            console.error("지도 컨테이너를 찾을 수 없습니다.");
            return;
          }

          try {
            const options = {
              center: new window.kakao.maps.LatLng(course.lat, course.lng),
              level: 5,
            };

            const map = new window.kakao.maps.Map(container, options);
            mapInstanceRef.current = map;

            // 마커 추가
            course.waypoints.forEach((point, index) => {
              const markerPosition = new window.kakao.maps.LatLng(
                point.lat,
                point.lng
              );
              const marker = new window.kakao.maps.Marker({
                position: markerPosition,
              });
              marker.setMap(map);

              // 인포윈도우 추가
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:8px;font-size:12px;white-space:nowrap;">${String(point.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
              });
              infowindow.open(map, marker);
            });

            // 경로 그리기 (폴리라인)
            if (course.waypoints.length > 1) {
              const path = course.waypoints.map(
                (point) => new window.kakao.maps.LatLng(point.lat, point.lng)
              );
              const polyline = new window.kakao.maps.Polyline({
                path: path,
                strokeWeight: 5,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.7,
                strokeStyle: "solid",
              });
              polyline.setMap(map);
            }
          } catch (error) {
            console.error("카카오맵 초기화 오류:", error);
          }
        });
      } else {
        console.error("카카오맵 API가 로드되지 않았습니다.");
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [course]);

  if (!course) {
    return (
      <div
        style={{
          maxWidth: "960px",
          margin: "40px auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            해당 코스를 찾을 수 없습니다.
          </p>
          <Link
            href="/news"
            style={{
              color: "#2563eb",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            ← 뉴스 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "0 20px 80px",
      }}
    >
      {/* 뒤로가기 버튼 */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/news"
          style={{
            color: "#2563eb",
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>←</span> <span>뉴스 목록으로 돌아가기</span>
        </Link>
      </div>

      {/* 코스 정보 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "8px",
            color: "#1e293b",
          }}
        >
          <span>{course?.title || ""}</span>
        </h1>
        <div
          style={{
            fontSize: "18px",
            color: "#64748b",
            marginBottom: "20px",
          }}
        >
          <span>{course?.subtitle || ""}</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "14px", color: "#475569" }}>
            <span>📍</span> <span>{course?.region || ""}</span>
          </div>
          <div style={{ fontSize: "14px", color: "#475569" }}>
            <span>🛣️</span> <span>{course?.distance || ""}</span>
          </div>
          <div style={{ fontSize: "14px", color: "#475569" }}>
            <span>⏱️</span> <span>{course?.duration || ""}</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "16px",
            lineHeight: 1.8,
            color: "#475569",
            whiteSpace: "pre-line",
          }}
        >
          {course?.description || ""}
        </div>
      </div>

      {/* 지도 영역 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "#1e293b",
          }}
        >
          코스 지도
        </h2>
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "500px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
          }}
        />
        <div
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          💡 카카오맵 API 키를 설정하면 지도가 표시됩니다
        </div>
      </div>

      {/* 경유지 정보 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "#1e293b",
          }}
        >
          주요 경유지
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(course?.waypoints || []).map((point, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  {point?.name || ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div
        style={{
          marginTop: "32px",
        }}
      >
        <Link
          href="/news"
          style={{
            display: "block",
            width: "100%",
            padding: "12px 24px",
            backgroundColor: "#f1f5f9",
            color: "#475569",
            borderRadius: "8px",
            textAlign: "center",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          <span>목록으로 돌아가기</span>
        </Link>
        <a
          href={`https://map.kakao.com/link/map/${encodeURIComponent(course?.title || "")},${course?.lat || 0},${course?.lng || 0}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            borderRadius: "8px",
            textAlign: "center",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <span>카카오앱에서 보기</span>
        </a>
      </div>
    </div>
  );
}

