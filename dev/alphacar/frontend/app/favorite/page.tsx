// app/favorite/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CarDetailModal from "../components/CarDetailModal"; // 모달 컴포넌트 불러오기

export default function FavoritePage() {
  const router = useRouter();
  
  // 상태 관리
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null); // 모달용 선택된 차량
  const [userId, setUserId] = useState(null);

  // 데이터 로딩
  useEffect(() => {
    // 1. 로그인 체크
    const storedUserId = localStorage.getItem("user_social_id") || localStorage.getItem("alphacar_user_id");
    
    if (!storedUserId) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/"); // 메인으로 리다이렉트
      return;
    }
    setUserId(storedUserId);

    // 2. 찜 목록 API 호출
    fetch(`/api/favorites/list?userId=${storedUserId}`) // VirtualService /api/favorites 규칙 사용
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API 응답 실패: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("💖 [찜 목록 페이지] API 응답:", data);
        // 데이터가 배열인지 확인하고, vehicleId가 populate되었는지 확인
        if (Array.isArray(data)) {
          setFavorites(data);
        } else if (data && Array.isArray(data.favorites)) {
          // 응답이 { favorites: [...] } 형태일 수 있음
          setFavorites(data.favorites);
        } else {
          console.warn("💖 [찜 목록 페이지] 예상치 못한 데이터 형식:", data);
          setFavorites([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("💖 [찜 목록 페이지] 찜 목록 로딩 실패:", err);
        setFavorites([]);
        setLoading(false);
      });
  }, [router]);

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    // 0원 이거나 null, undefined면 처리
    if (!price) return "가격 정보 없음";
    
    const num = Number(price);
    if (isNaN(num) || num === 0) return "가격 정보 없음";
    
    // 10000으로 나눠서 '만원' 단위 표시
    return (num / 10000).toLocaleString() + "만원 ~";
  };

  // 차량 클릭 시 개별 견적 페이지로 이동
  const handleCarClick = (favItem) => {
    // vehicleId가 populate되었는지 확인
    const car = favItem.vehicleId || favItem.vehicle || favItem;
    if (!car) {
      console.warn("💖 [찜 목록 페이지] 차량 데이터 없음:", favItem);
      return;
    }

    // 차량 이름 추출
    const carName = car.name || car.vehicle_name;
    if (!carName) {
      alert("차량 정보를 불러올 수 없습니다.");
      return;
    }

    // 차량 이름에서 모델명 추출 (예: "[현대] 그랜저" -> "그랜저")
    let modelName = carName.replace(/\[[^\]]+\]\s*/, "").trim();
    // 공백으로 분리하여 첫 번째 단어를 모델명으로 사용
    const nameParts = modelName.split(/\s+/);
    if (nameParts.length > 0) {
      modelName = nameParts[0];
    }

    // 브랜드명 추출
    const brandMatch = carName.match(/\[([^\]]+)\]/);
    const brandName = brandMatch ? brandMatch[1] : (car.manufacturer || car.brand_name || "");

    // 차량 ID 추출 (lineup_id 우선)
    const trimId = car.lineup_id || car.vehicleId || car._id || carName;

    // 개별 견적 페이지로 이동
    const queryParams = new URLSearchParams();
    if (trimId) {
      queryParams.append('trimId', encodeURIComponent(String(trimId)));
    }
    if (modelName) {
      queryParams.append('modelName', encodeURIComponent(modelName));
    }
    if (brandName) {
      queryParams.append('brandName', encodeURIComponent(brandName));
    }
    router.push(`/quote/personal?${queryParams.toString()}`);
  };

  // 모달 닫기 핸들러 (필요시 사용)
  const handleCloseModal = () => {
    setSelectedCar(null);
    window.location.reload(); 
  };

  return (
    <main style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        
        {/* 헤더 영역 */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
            내가 찜한 차량 <span style={{ color: "#2563eb", fontSize: "18px", marginLeft: "4px" }}>{favorites.length}</span>
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
            관심 있는 차량을 한 곳에서 모아볼 수 있어요.
          </p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ padding: "60px", textAlign: "center", color: "#999", fontSize: "16px" }}>
            데이터를 불러오는 중입니다...
          </div>
        )}

        {/* 데이터 없음 상태 */}
        {!loading && favorites.length === 0 && (
          <div style={{ padding: "100px 0", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>❤️</div>
            <p style={{ color: "#666", fontSize: "16px", marginBottom: "24px" }}>아직 찜한 차량이 없어요.</p>
            <p style={{ color: "#999", fontSize: "14px", marginBottom: "24px" }}>
              마음에 드는 차량 우측 하단의 하트 버튼을 눌러 찜 목록에 추가해 보세요.
            </p>
            <button 
              onClick={() => router.push('/')}
              style={{ padding: "12px 30px", borderRadius: "99px", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px" }}
            >
              차량 구경하러 가기
            </button>
          </div>
        )}

        {/* 차량 리스트 그리드 */}
        {!loading && favorites.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
            {favorites.map((fav, idx) => {
              // vehicleId가 populate되었는지 확인
              const car = fav.vehicleId || fav.vehicle || fav;
              
              // 디버깅: fav와 car 객체 확인
              console.log("💖 [찜 목록 페이지] fav 객체:", fav);
              console.log("💖 [찜 목록 페이지] car 객체:", car);
              
              // 차량 데이터가 없거나 필수 필드가 없는 경우
              if (!car) {
                console.warn("💖 [찜 목록 페이지] 차량 데이터 없음 (car가 null):", fav);
                return null;
              }
              
              // 차량 이름이나 ID가 하나라도 있으면 표시
              const hasName = car.name || car.vehicle_name;
              const hasId = car._id || car.lineup_id || car.vehicleId || car.id;
              
              if (!hasName && !hasId) {
                console.warn("💖 [찜 목록 페이지] 차량 이름/ID 모두 없음:", fav, car);
                return null;
              }

              // 차량 이름 추출
              const carName = car.name || car.vehicle_name || "";
              const brandName = car.manufacturer || car.brand_name || "";
              
              // 가격 추출 (우선순위: price > minPrice > trims[0].price)
              const price = car.price || car.minPrice || (car.trims && car.trims.length > 0 ? car.trims[0].price : null);
              
              // 이미지 URL 추출
              const imageUrl = car.imageUrl || car.main_image || car.image || null;

              return (
                <div 
                  key={fav._id || `fav-${idx}`}
                  onClick={() => handleCarClick(fav)}
                  style={{ 
                    backgroundColor: "#fff", borderRadius: "16px", padding: "20px", cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", transition: "transform 0.2s, box-shadow 0.2s",
                    border: "1px solid #f1f5f9"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* 이미지 영역 */}
                  <div style={{ width: "100%", height: "150px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderRadius: "12px", overflow: "hidden" }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={carName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "13px" }}>이미지 없음</span>
                    )}
                  </div>

                  {/* 텍스트 정보 */}
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px", fontWeight: "600" }}>
                    {brandName ? `[${brandName}]` : "[미분류]"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", marginBottom: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {carName || "차량명 없음"}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>시작가</span>
                    <span style={{ fontSize: "17px", fontWeight: "700", color: "#2563eb" }}>
                      {price ? (Number(price) / 10000).toLocaleString() + "만원" : "가격 문의"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 모달 (필요시 사용) */}
        {selectedCar && (
          <CarDetailModal car={selectedCar} onClose={handleCloseModal} />
        )}

      </div>
    </main>
  );
}
