// app/news/drive/page.tsx
"use client";

import Link from "next/link";

// 드라이브 코스 카테고리 데이터
const driveCourseCategories = [
  {
    id: 1,
    title: "로맨틱 야경 드라이브 코스",
    description: "서울의 아름다운 야경을 즐길 수 있는 로맨틱한 드라이브 코스",
    courses: [
      {
        id: 4,
        name: "북악스카이웨이",
        description: "서울 시내와 한강, 남산까지 한눈에 담는 최고의 야경 명소",
        highlight: "팔각정에서 쉬어가세요",
      },
      {
        id: 5,
        name: "남산순환도로",
        description: "N서울타워로 이어지는 길을 따라 드라이브하며 서울의 야경을 즐길 수 있습니다",
        highlight: "서울의 상징적인 야경 코스",
      },
      {
        id: 6,
        name: "한강 야경 코스",
        description: "잠수교 → 반포대교 → 세빛섬으로 이어지는 환상적인 야경",
        highlight: "노들섬과 양화대교를 따라 망원한강공원으로 이어지는 코스도 좋아요",
      },
    ],
    activities: [
      {
        title: "한강 공원",
        description: "차에서 내려 잠원지구, 반포지구 등에서 산책하며 야경을 감상하거나 피크닉을 즐기세요.",
      },
      {
        title: "서울로7017/동대문",
        description: "도시의 활기찬 밤을 느끼고 싶다면 서울로7017 하늘정원이나 동대문 야시장을 방문해 보세요.",
      },
      {
        title: "한강 해치카",
        description: "한강을 따라 귀여운 해치카를 타고 20분간 도는 이색적인 데이트도 가능합니다.",
      },
    ],
  },
  {
    id: 2,
    title: "낮 드라이브 & 감성 나들이",
    description: "자연 속에서 여유롭게 즐기는 힐링 드라이브 코스",
    courses: [
      {
        id: 2,
        name: "양평 두물머리/세미원",
        description: "서울 근교에서 자연을 느끼고 싶다면, 아름다운 풍경과 함께 드라이브를 즐길 수 있습니다",
        highlight: "수령 400년의 느티나무와 황포돛단배로 유명",
      },
      {
        id: 7,
        name: "파주",
        description: "마장호수 출렁다리, 헤이리 예술마을 등 독특하고 예쁜 곳들이 많아 드라이브 코스로 인기입니다",
        highlight: "예술과 자연이 어우러진 특별한 경험",
      },
      {
        id: 1,
        name: "남양주 팔당호",
        description: "솔몽 베이커리 등 뷰 좋은 카페와 함께 드라이브를 즐기기 좋습니다",
        highlight: "한강과 예봉산의 아름다운 전망",
      },
    ],
    activities: [
      {
        title: "인플럭스 남양주",
        description: "약 1,000평 규모의 대형 감성 카페로, 한강과 예봉산의 아름다운 전망을 감상할 수 있습니다.",
      },
      {
        title: "물의 정원",
        description: "약 2만 평 규모의 부지에 자연 그대로의 습지와 들꽃 군락, 산책 데크길이 조화롭게 어우러져 있습니다.",
      },
      {
        title: "세미원",
        description: "연꽃을 주제로 한 수생식물 정원으로, 다양한 연꽃과 수생식물을 감상할 수 있습니다.",
      },
    ],
  },
];

export default function DriveCourseRecommendationPage() {
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

      {/* 메인 타이틀 */}
      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            marginBottom: "12px",
            color: "#1e293b",
          }}
        >
          <span>서울 근교 드라이브 코스 추천</span>
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          <span>자연과 힐링을 만끽할 수 있는 특별한 드라이브 코스를 소개합니다</span>
        </p>
      </div>

      {/* 코스 카테고리 */}
      {driveCourseCategories.map((category) => (
        <div
          key={category.id}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* 카테고리 헤더 */}
          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "#1e293b",
              }}
            >
              <span>{category.title}</span>
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: 0,
              }}
            >
              <span>{category.description}</span>
            </p>
          </div>

          {/* 코스 리스트 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            {category.courses.map((course) => (
              <Link
                key={course.id}
                href={`/news/drive/${course.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    position: "relative",
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
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      color: "#1e293b",
                      paddingRight: "40px",
                    }}
                  >
                    <span>{course.name}</span>
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#475569",
                      lineHeight: 1.6,
                      marginBottom: "8px",
                    }}
                  >
                    <span>{course.description}</span>
                  </p>
                  {course.highlight && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#3b82f6",
                        fontWeight: 600,
                        padding: "8px 12px",
                        backgroundColor: "#eff6ff",
                        borderRadius: "6px",
                        marginTop: "12px",
                      }}
                    >
                      <span>{course.highlight}</span>
                    </div>
                  )}
                  {/* 화살표 아이콘 */}
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
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
              </Link>
            ))}
          </div>

          {/* 드라이브 후 즐길 거리 */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "32px",
              borderTop: "2px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "#1e293b",
              }}
            >
              <span>드라이브 후 즐길 거리</span>
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px",
              }}
            >
              {category.activities.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "10px",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#1e293b",
                    }}
                  >
                    <span>{activity.title}</span>
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    <span>{activity.description}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
