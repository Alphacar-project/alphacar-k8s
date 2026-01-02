// app/news/page.js
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

// 🔹 트렌드 아티클 더미 데이터 (getcha.kr 스타일)
const trendArticles = [
  {
    id: 1,
    title: "겨울에 디젤차가 유독 추운 이유, 가솔린과 비교해봤어요",
    bgColor: "#ffe5e5",
    icon: "🌡️",
    image: "/news/thermometer.png", // 첫 번째 이미지: 온도계 (빨간색과 파란색)
  },
  {
    id: 2,
    title: "운전자보다 똑똑한 자동차 비서, BMW AI 기반 '프로액티브 케어' 국내 도입",
    bgColor: "#1a1a2e",
    icon: "🤖",
    image: "/news/bmw-ai-robot.png", // 두 번째 이미지: 로봇
  },
  {
    id: 3,
    title: "2025년 11월 수입차 판매량 Top 3",
    bgColor: "#e8d5ff",
    icon: "📊",
    image: "/news/car-sales-nov.png", // 세 번째 이미지: Top 3 배지
  },
  {
    id: 4,
    title: "2025년 10월 수입차 판매량 Top 3",
    bgColor: "#e8d5ff",
    icon: "📊",
    image: "/news/car-sales-oct.png", // 네 번째 이미지: Top 3 배지
  },
  {
    id: 5,
    title: "2026년 유류세 인하폭 축소로 주유비는 얼마나 오르나? 정책 변화 완전정리",
    bgColor: "#2d2d2d",
    icon: "⛽",
    image: "/news/fuel-price.png", // 다섯 번째 이미지: 주유기
  },
  {
    id: 6,
    title: "터치스크린 시대 끝나가나? 차량 UI에서 버튼이 돌아온다",
    bgColor: "#ffe5e5",
    icon: "🔴",
    image: "/news/red-button.png", // 여섯 번째 이미지: 빨간 버튼
  },
  {
    id: 7,
    title: "자동차 vs 우주, 기업들이 위성망을 쏘아 올리는 이유",
    bgColor: "#1a1a3e",
    icon: "🛰️",
    image: "/news/satellite.png", // 일곱 번째 이미지: 위성
  },
  {
    id: 8,
    title: "자동차 사이버보안, AI가 지키는 미래차 안전",
    bgColor: "#e0f2fe",
    icon: "🛡️",
    image: "/news/cybersecurity-shield.png", // 여덟 번째 이미지: 사이버보안 방패
  },
];

// 🔹 코스 추천 카드 (드라이브 코스로 연결)
const driveCourseCards = [
  {
    id: 1,
    title: "남양주 팔당호",
    desc: "팔당호뷰 따라 달리는 힐링 드라이브",
    tag: "자연 & 힐링",
    driveCourseId: 1,
    image: "/news/drive/paldangho.jpg.png", // 첫 번째 이미지: 다리와 강 풍경
  },
  {
    id: 2,
    title: "양평 두물머리",
    desc: "강을 끼고 달리는 감성 드라이브",
    tag: "자연 & 힐링",
    driveCourseId: 2,
    image: "/news/drive/dumulmeori.jpg.png", // 두 번째 이미지: 가을 풍경 호수/강
  },
  {
    id: 3,
    title: "북악스카이웨이",
    desc: "서울 도심 야경 맛집 코스",
    tag: "야경 & 전망",
    driveCourseId: 4,
    image: "/news/drive/bugak-skyway.jpg.png", // 네 번째 이미지: 야경 전망대
  },
  {
    id: 4,
    title: "북한산-우이천",
    desc: "산과 물을 동시에 즐기는 코스",
    tag: "자연 & 힐링",
    driveCourseId: 3,
    image: "/news/drive/bukhansan.jpg.png", // 세 번째 이미지: 벚꽃 강변 풍경
  },
];

// 🔹 시승기 유튜브 영상 목록
const driveVideos = [
  {
    id: 1,
    title: "전기 SUV 실사용 시승기",
    videoId: "BgTb_xbuaAU",
  },
  {
    id: 2,
    title: "하이브리드 세단 고속도로 주행",
    videoId: "EEcnUB9w45w",
  },
  {
    id: 3,
    title: "패밀리카 SUV 실내·승차감 리뷰",
    videoId: "f-M4ME3dATw",
  },
  {
    id: 4,
    title: "장거리 주행 전비 테스트",
    videoId: "Z9C259sx4gg",
  },
  {
    id: 5,
    title: "도심 주행 / 주차 편의성 리뷰",
    videoId: "pgWDpctCzAY",
  },
  {
    id: 6,
    title: "고성능 전기차 시승기",
    videoId: "ZYL3pIW-68Y",
  },
];

export default function NewsPage() {
  // 유튜브 모달 상태
  const [activeVideoId, setActiveVideoId] = useState(null);

  const openVideo = (videoId) => setActiveVideoId(videoId);
  const closeVideo = () => setActiveVideoId(null);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "40px auto 80px",
        padding: "0 20px",
      }}
    >
      {/* 상단 위치 표시 / 소제목 */}
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        ALPHACAR 소식
      </div>

      {/* 상단 헤더 영역 */}
      <section
        style={{
          background: "linear-gradient(to right, #eff4ff, #f4f7ff)",
          borderRadius: "8px",
          padding: "28px 24px 32px",
          marginBottom: "32px",
        }}
      >
        <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>
          알파카와 자동차, 사용기까지. 자동차 관련 깊이 있는 이야기를 만나보세요
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: "4px",
          }}
        >
          최신 자동차
          <br />
          소식과 이야기
        </h1>
      </section>

      {/* 1. 트렌드 영역 (getcha.kr 스타일) - 핫이슈 */}
      <section id="hot-issue" style={{ marginBottom: "40px", scrollMarginTop: "80px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              트렌드
            </h2>
            <div style={{ fontSize: "12px", color: "#999" }}>
              ALPHACAR에서 모은 인기 기사
            </div>
          </div>
        </div>

        {/* 그리드 카드 레이아웃 (한 줄에 4개씩 총 2줄) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {trendArticles.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* 썸네일 카드 */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  borderRadius: "12px",
                  backgroundColor: item.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    style={{
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // 이미지 로드 실패 시 아이콘 표시
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const iconDiv = document.createElement("div");
                        iconDiv.style.fontSize = "48px";
                        iconDiv.style.opacity = "0.8";
                        iconDiv.textContent = item.icon;
                        parent.appendChild(iconDiv);
                      }
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "48px",
                      opacity: 0.8,
                    }}
                  >
                    {item.icon}
                  </div>
                )}
              </div>

              {/* 제목 */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: "#1e293b",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.title}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. 코스 추천 (내차와의 데이트) */}
      <section id="drive-course" style={{ marginBottom: "16px", scrollMarginTop: "80px" }}>
        <div
          style={{
            backgroundColor: "#fff7e6",
            borderRadius: "10px",
            padding: "20px 16px",
          }}
        >
          {/* 타이틀 */}
          <Link
            href="/news/drive"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <div
              style={{
                marginBottom: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  코스 추천
                </h2>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  서울 근교 자연 & 힐링 드라이브 코스
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: "#3b82f6",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                →
              </div>
            </div>
          </Link>

          {/* 카드 리스트 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            {driveCourseCards.map((card) => (
              <Link
                key={card.id}
                href={`/news/drive/${card.driveCourseId}`}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  padding: "8px",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "1px solid #e2e8f0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/10",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    background:
                      "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    color: "#0369a1",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      style={{
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const iconDiv = document.createElement("div");
                          iconDiv.style.fontSize = "32px";
                          iconDiv.style.opacity = "0.8";
                          iconDiv.textContent = "🗺️";
                          parent.appendChild(iconDiv);
                        }
                      }}
                    />
                  ) : (
                    <span>🗺️</span>
                  )}
                  {/* 클릭 가능 표시 오버레이 */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "rgba(59, 130, 246, 0.9)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    →
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    marginBottom: "4px",
                    lineHeight: 1.4,
                    color: "#1e293b",
                    padding: "0 4px",
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "6px",
                    lineHeight: 1.5,
                    padding: "0 4px",
                  }}
                >
                  {card.desc}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    padding: "0 4px",
                  }}
                >
                  {card.tag}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 시승기 섹션 (흰색 카드 + 유튜브 + CTA) */}
      <section id="test-drive-review" style={{ marginBottom: "40px", scrollMarginTop: "80px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            padding: "22px 20px 24px",
          }}
        >
          {/* 상단 제목 */}
          <div
            style={{
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              시승기
            </h2>
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              전문가의 상세한 시승 리뷰
            </div>
          </div>

          {/* 유튜브 썸네일 리스트 (3개씩 2줄 그리드) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {driveVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => openVideo(video.videoId)}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#000",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.3)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%", // 16:9
                      height: 0,
                    }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* 플레이 버튼 */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft: "13px solid #ffffff",
                            marginLeft: "2px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 제목 */}
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#111827",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {video.title}
                </div>
              </button>
            ))}
          </div>

          {/* CTA : 남색 박스 + 아래 흰 배경 버튼 - 확대 */}
          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              marginTop: "32px",
            }}
          >
            {/* 남색 영역 - 텍스트만 */}
            <div
              style={{
                backgroundColor: "#1f3b8f",
                padding: "32px 24px 28px",
                textAlign: "center",
                color: "#ffffff",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "10px",
                  letterSpacing: "-0.02em",
                }}
              >
                직접 경험해보세요
              </div>
              <div
                style={{
                  fontSize: "16px",
                  opacity: 0.95,
                  lineHeight: 1.6,
                }}
              >
                원하시는 차량의 시승을 신청하고 직접 체험해보세요.
              </div>
            </div>

            {/* 하얀 배경 영역 + 버튼 */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px 16px 28px",
                textAlign: "center",
              }}
            >
              <Link href="/news/test-drive">
                <button
                  type="button"
                  style={{
                    padding: "16px 48px",
                    borderRadius: "999px",
                    border: "none",
                    background: "#3b82f6",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "18px",
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2563eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#3b82f6";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  시승 신청하기
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 유튜브 모달 (화면 가운데 크게 재생) */}
      {activeVideoId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "90%",
              maxWidth: "960px",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#000",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* X 버튼 */}
            <button
              type="button"
              onClick={closeVideo}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: "18px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {/* 유튜브 iframe */}
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="시승기 영상"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
