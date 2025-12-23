// app/components/CarDetailModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 타입 정의
interface Car {
  vehicleId?: string;
  _id?: string;
  id?: string;
  name?: string;
  vehicle_name?: string;
  manufacturer?: string;
  brand_name?: string;
  imageUrl?: string;
  main_image?: string;
  minPrice?: number;
  maxPrice?: number;
  base_price?: number;
  price?: number;
  trims?: Array<{ price?: number }>;
  [key: string]: any;
}

interface CarDetailModalProps {
  car: Car | null;
  onClose: () => void;
}

interface DisplacementRange {
  min: number;
  max: number;
}

interface FuelEfficiencyRange {
  min: number;
  max: number;
}

interface Specs {
  release_date?: string;
  displacement_range?: DisplacementRange;
  fuel_efficiency_range?: FuelEfficiencyRange;
  [key: string]: any;
}

interface CarDetail {
  specs?: Specs;
  all_color_images?: any[];
  color_images?: any[];
  all_exterior_images?: any[];
  exterior_images?: any[];
  all_interior_images?: any[];
  interior_images?: any[];
  [key: string]: any;
}

interface ReviewData {
  average_score?: number;
  avg_rating?: number;
  total_reviews?: number;
  sentiment_ratio?: {
    positive?: number;
    negative?: number;
  };
  summary?: string[];
  pros?: string[];
  cons?: string[];
  [key: string]: any;
}

interface ImageItem {
  url: string;
  name: string;
  type: string;
  colorName?: string;
}

interface HeartIconProps {
  filled: boolean;
}

const formatPrice = (price: any): string => {
  if (!price) return "가격 문의";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return String(price);
  return (numPrice / 10000).toLocaleString() + "만원";
};

const HeartIcon: React.FC<HeartIconProps> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill={filled ? "#ff4d4f" : "rgba(0,0,0,0.5)"} stroke={filled ? "#ff4d4f" : "#ffffff"} strokeWidth="2" style={{ transition: "all 0.2s ease" }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export default function CarDetailModal({ car, onClose }: CarDetailModalProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [carDetail, setCarDetail] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(true);
  
  // 색상 이미지 표시 개수 상태
  const [colorImagesCount, setColorImagesCount] = useState<number>(4);
  const [exteriorImagesCount, setExteriorImagesCount] = useState<number>(4);
  const [interiorImagesCount, setInteriorImagesCount] = useState<number>(4);
  
  // 이미지 로드 실패 추적 (각 갤러리별로)
  const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(new Set());
  
  // 이미지 라이트박스 상태
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [allImages, setAllImages] = useState<ImageItem[]>([]);

  // ✅ [최종 수정] 백엔드가 보내준 'vehicleId' 필드를 직접 사용합니다.
  const targetId = car?.vehicleId || car?._id || car?.id; 
  
  const carName = car?.name || car?.vehicle_name;
  const brandName = car?.manufacturer || car?.brand_name;
  // ✅ 이미지 우선순위: 1) car 객체의 imageUrl (메인페이지에서 전달), 2) carDetail의 main_image (API 응답), 3) car의 main_image
  // carDetail이 업데이트되면 컴포넌트가 리렌더링되면서 imageUrl도 다시 계산됨
  const imageUrl = car?.imageUrl || carDetail?.main_image || car?.main_image || carDetail?.image_url;
  const displayPrice = car?.minPrice || (car?.trims && car.trims[0]?.price) || car?.base_price || car?.price;

  useEffect(() => {
    if (!car) return;
    
    // 디버깅: 전달받은 car 객체 확인
    console.log("🚗 [모달] 전달받은 car 객체:", car);
    console.log("🚗 [모달] targetId:", targetId);
    
    const storedUserId = localStorage.getItem("user_social_id") || localStorage.getItem("alphacar_user_id");
    setUserId(storedUserId);

    // 차량 상세 정보 가져오기
    if (targetId) {
      setLoading(true);
      const apiUrl = `/api/vehicles/detail?trimId=${encodeURIComponent(targetId)}`;
      console.log("🌐 [모달] API 호출:", apiUrl);
      
      fetch(apiUrl)
        .then(res => {
          console.log("📡 [모달] API 응답 상태:", res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data: CarDetail) => {
          console.log("📦 [차량 상세 데이터 응답]:", data);
          console.log("📦 [specs 데이터]:", data?.specs);
          console.log("📦 [배기량 범위]:", data?.specs?.displacement_range);
          console.log("📦 [복합연비 범위]:", data?.specs?.fuel_efficiency_range);
          console.log("📦 [색상 이미지]:", data?.all_color_images?.length);
          setCarDetail(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("❌ [모달] 차량 상세 정보 로딩 실패:", err);
          setLoading(false);
        });
    } else {
      console.warn("⚠️ [모달] targetId가 없습니다. car 객체:", car);
    }

    // 리뷰 분석 데이터 가져오기
    if (carName) {
      setReviewLoading(true);
      fetch(`/api/review-analysis?vehicleName=${encodeURIComponent(carName)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data: ReviewData) => {
          console.log("📊 [리뷰 분석 데이터]:", data);
          setReviewData(data);
          setReviewLoading(false);
        })
        .catch(err => {
          console.error("❌ [모달] 리뷰 분석 데이터 로딩 실패:", err);
          setReviewData(null);
          setReviewLoading(false);
        });
    }

    if (storedUserId && targetId) {
      // 조회수 기록
      fetch(`/api/log-view/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: storedUserId })
      }).then((res) => {
        if (res.ok) window.dispatchEvent(new Event("vehicleViewed"));
      }).catch((err) => console.error("히스토리 저장 실패:", err));

      // 찜 상태 확인
      fetch(`/api/favorites/status?userId=${storedUserId}&vehicleId=${targetId}`)
        .then(res => res.json())
        .then((data: { isLiked?: boolean }) => setIsLiked(data.isLiked || false))
        .catch(err => console.error("찜 상태 확인 실패:", err));
    }
  }, [car, targetId, carName]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return alert("로그인이 필요한 서비스입니다.");
    
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);

    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vehicleId: targetId })
      });
      if (!res.ok) throw new Error("API 오류");
    } catch (err) {
      console.error("찜하기 실패:", err);
      setIsLiked(prevLiked);
    }
  };

  if (!car) return null;

  // ✅ [최종 수정] 이동 로직: 개별 견적 페이지로 이동 (트림 지정 없이 모델만 선택)
  const handleGoToQuoteResult = () => {
    // 차량 이름에서 브랜드명과 모델명 추출 (예: "[기아] 모닝" -> 브랜드: "기아", 모델: "모닝")
    const vehicleName = carDetail?.vehicle_name || car?.vehicle_name || car?.name || carName || "";
    const brandMatch = vehicleName.match(/\[([^\]]+)\]/);
    const extractedBrandName = brandMatch ? brandMatch[1] : (carDetail?.brand_name || car?.brand_name || car?.manufacturer || brandName || "");
    const extractedModelName = vehicleName.replace(/\[[^\]]+\]\s*/, "").split(" ")[0].trim() || "";
    
    // 개별 견적 페이지로 이동 (트림은 선택되지 않은 상태, 모델만 전달)
    const queryParams = new URLSearchParams();
    if (extractedModelName) {
      queryParams.append('modelName', extractedModelName);
    }
    if (extractedBrandName) {
      queryParams.append('brandName', extractedBrandName);
    }
    
    // trimId가 있으면 전달 (선택된 트림이 있는 경우)
    if (targetId) {
      queryParams.append('trimId', targetId);
    }
    
    const queryString = queryParams.toString();
    const url = `/quote/personal${queryString ? `?${queryString}` : ''}`;
    
    console.log("Navigating to:", url, { extractedModelName, extractedBrandName, targetId });
    router.push(url);
  };

  // 제원 정보 포맷팅
  const formatDisplacement = (range?: DisplacementRange): string => {
    if (!range) return "정보 없음";
    if (range.min === range.max) {
      return `${range.min.toLocaleString()}cc`;
    }
    return `${range.min.toLocaleString()}cc ~ ${range.max.toLocaleString()}cc`;
  };

  const formatFuelEfficiency = (range?: FuelEfficiencyRange): string => {
    if (!range) return "정보 없음";
    if (range.min === range.max) {
      return `${range.min.toFixed(1)}km/L`;
    }
    return `${range.min.toFixed(1)}km/L ~ ${range.max.toFixed(1)}km/L`;
  };

  // 색상 이미지 렌더링 헬퍼
  const renderImageGallery = (
    images: any[], 
    allImages: any[], 
    count: number, 
    setCount: React.Dispatch<React.SetStateAction<number>>, 
    title: string
  ) => {
    // 이미지가 없으면 섹션 자체를 표시하지 않음
    if (!allImages || allImages.length === 0) return null;
    
    // 유효한 이미지 URL이 있는지 확인
    const validImages = allImages.filter((img: any) => {
      const imageUrl = img.image_url || img.url || img;
      return imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '';
    });
    
    // 유효한 이미지가 없으면 섹션을 표시하지 않음
    if (validImages.length === 0) return null;
    
    const visibleImages = validImages.slice(0, count);
    const hasMore = validImages.length > count;
    
    // 현재 갤러리의 실패한 이미지 키 필터링
    const galleryPrefix = `${title}-`;
    const galleryFailedKeys = Array.from(failedImageKeys).filter(key => key.startsWith(galleryPrefix));
    
    // 모든 이미지가 로드 실패했는지 확인
    const allImagesFailed = visibleImages.length > 0 && galleryFailedKeys.length === visibleImages.length;
    
    // 모든 이미지가 실패하면 섹션을 표시하지 않음
    if (allImagesFailed) return null;

    return (
      <div style={{ marginTop: "15px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#333", textAlign: "left" }}>{title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          {visibleImages.map((img: any, idx: number) => {
            const imageUrl = img.image_url || img.url || img;
            const imageName = img.color_name || `이미지 ${idx + 1}`;
            const imageKey = `${title}-${idx}`;
            
            // 이미지가 이미 실패했으면 표시하지 않음
            if (failedImageKeys.has(imageKey)) return null;
            
            return (
              <div 
                key={idx} 
                style={{ position: "relative", aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", border: "1px solid #eee", cursor: "pointer" }}
                onClick={() => handleImageClick(imageUrl, validImages, idx)}
              >
                <img 
                  src={imageUrl} 
                  alt={imageName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.transform = "scale(1)";
                  }}
                  onError={(e) => {
                    // 이미지 로드 실패 시 실패 목록에 추가
                    setFailedImageKeys(prev => new Set([...prev, imageKey]));
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement as HTMLElement;
                    if (parent) parent.style.display = "none";
                  }}
                />
                {img.color_name && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", padding: "6px 8px", color: "#fff", fontSize: "11px", fontWeight: 500 }}>
                    {img.color_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {hasMore && (
          <button
            onClick={() => setCount(count + 4)}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "10px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#333",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#e5e5e5";
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = "#f5f5f5";
            }}
          >
            더보기 ({validImages.length - count}개 더)
          </button>
        )}
      </div>
    );
  };

  // 제원 정보 및 이미지 데이터 추출
  const specs = carDetail?.specs || {};
  const colorImages = carDetail?.all_color_images || carDetail?.color_images || [];
  const exteriorImages = carDetail?.all_exterior_images || carDetail?.exterior_images || [];
  const interiorImages = carDetail?.all_interior_images || carDetail?.interior_images || [];
  
  // 모든 이미지를 하나의 배열로 통합 (라이트박스용)
  useEffect(() => {
    const images: ImageItem[] = [];
    
    // 메인 이미지 추가 (우선순위: car.imageUrl > carDetail.main_image > car.main_image > carDetail.image_url)
    const mainImageUrl = car?.imageUrl || carDetail?.main_image || car?.main_image || carDetail?.image_url;
    if (mainImageUrl) {
      images.push({ url: mainImageUrl, name: carName || "메인 이미지", type: "main" });
    }
    
    // 색상 이미지 추가
    colorImages.forEach((img: any) => {
      const url = img.image_url || img.url || img;
      if (url && typeof url === 'string' && url.trim() !== '') {
        images.push({ 
          url, 
          name: img.color_name || "색상 이미지", 
          type: "color",
          colorName: img.color_name 
        });
      }
    });
    
    // 외관 이미지 추가
    exteriorImages.forEach((img: any) => {
      const url = img.image_url || img.url || img;
      if (url && typeof url === 'string' && url.trim() !== '') {
        images.push({ 
          url, 
          name: "외관 이미지", 
          type: "exterior" 
        });
      }
    });
    
    // 내관 이미지 추가
    interiorImages.forEach((img: any) => {
      const url = img.image_url || img.url || img;
      if (url && typeof url === 'string' && url.trim() !== '') {
        images.push({ 
          url, 
          name: "내관 이미지", 
          type: "interior" 
        });
      }
    });
    
    setAllImages(images);
  }, [car?.imageUrl, carDetail?.main_image, car?.main_image, carDetail?.image_url, carName, colorImages, exteriorImages, interiorImages]);
  
  // 키보드 이벤트 처리 (ESC로 닫기, 화살표로 이동)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, allImages.length]);
  
  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string, galleryImages: any[], clickedIndex: number) => {
    // 클릭된 이미지가 전체 이미지 배열에서 몇 번째인지 찾기
    let foundIndex = allImages.findIndex(img => img.url === imageUrl);
    if (foundIndex === -1) {
      // 전체 배열에서 못 찾으면 해당 갤러리에서 찾기
      const galleryUrls = galleryImages.map((img: any) => img.image_url || img.url || img).filter((url: any) => url);
      foundIndex = allImages.findIndex(img => galleryUrls.includes(img.url));
      if (foundIndex === -1) {
        foundIndex = clickedIndex;
      }
    }
    setLightboxIndex(foundIndex >= 0 ? foundIndex : 0);
    setLightboxOpen(true);
  };
  
  // 라이트박스 네비게이션
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };
  
  // 디버깅: 데이터 확인
  if (carDetail) {
    console.log("🔍 [모달] carDetail:", carDetail);
    console.log("🔍 [모달] specs:", specs);
    console.log("🔍 [모달] colorImages:", colorImages.length);
    console.log("🔍 [모달] exteriorImages:", exteriorImages.length);
    console.log("🔍 [모달] interiorImages:", interiorImages.length);
  }

  // 별점 렌더링 헬퍼
  const renderStars = (rating: any) => {
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
    
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {Array.from({ length: fullStars }, (_, i) => (
          <span key={`full-${i}`} style={{ color: "#ffc107", fontSize: "18px" }}>★</span>
        ))}
        {hasHalfStar && <span key="half" style={{ color: "#ffc107", fontSize: "18px" }}>☆</span>}
        {Array.from({ length: emptyStars }, (_, i) => (
          <span key={`empty-${i}`} style={{ color: "#ddd", fontSize: "18px" }}>★</span>
        ))}
        <span style={{ marginLeft: "8px", fontSize: "16px", fontWeight: 600, color: "#333" }}>
          {numRating > 0 ? numRating.toFixed(1) : "0.0"}
        </span>
      </div>
    );
  };

  return (
    <div 
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, overflowY: "auto", padding: "20px 10px" }} 
      onClick={(e) => {
        // 라이트박스가 열려있으면 차량 정보 모달을 닫지 않음
        if (!lightboxOpen) {
          onClose();
        }
      }}
    >
      {/* 중앙 컨테이너: 리뷰 패널과 차량 정보 모달을 함께 묶음 */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: "8px", maxWidth: "1200px", width: "100%" }}>
        {/* 왼쪽 리뷰 정보 패널 */}
        <div style={{ 
          backgroundColor: "#fff", 
          width: "350px", 
          maxHeight: "90vh", 
          borderRadius: "16px", 
          padding: "24px 20px", 
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)", 
          overflowY: "auto",
          position: "relative"
        }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "#333", borderBottom: "2px solid #eee", paddingBottom: "12px" }}>
          리뷰 분석
        </h3>

        {reviewLoading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
            리뷰 분석 중...
          </div>
        ) : reviewData ? (
          <>
            {/* 별점 */}
            {(reviewData.average_score || reviewData.avg_rating) && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>평균 별점</div>
              {renderStars(reviewData.average_score || reviewData.avg_rating)}
              {reviewData.total_reviews && (
                <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                  ({reviewData.total_reviews}개 리뷰)
                </div>
              )}
            </div>
          )}

          {/* 긍정/부정 비율 */}
          {reviewData.sentiment_ratio && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>감정 분석</div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>긍정</span>
                    <span style={{ fontSize: "12px", color: "#666" }}>{reviewData.sentiment_ratio.positive || 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${reviewData.sentiment_ratio.positive || 0}%`, 
                      height: "100%", 
                      backgroundColor: "#22c55e",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600 }}>부정</span>
                    <span style={{ fontSize: "12px", color: "#666" }}>{reviewData.sentiment_ratio.negative || 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${reviewData.sentiment_ratio.negative || 0}%`, 
                      height: "100%", 
                      backgroundColor: "#ef4444",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 리뷰 요약 */}
          {reviewData.summary && reviewData.summary.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", fontWeight: 600 }}>리뷰 요약</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {reviewData.summary.map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: "10px 12px", 
                    backgroundColor: "#f8f9fa", 
                    borderRadius: "8px", 
                    fontSize: "13px", 
                    color: "#333",
                    lineHeight: "1.5"
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 장점 */}
          {reviewData.pros && reviewData.pros.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", fontWeight: 600 }}>장점</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {reviewData.pros.map((item, idx) => (
                  <span key={idx} style={{ 
                    padding: "6px 12px", 
                    backgroundColor: "#dcfce7", 
                    color: "#166534", 
                    borderRadius: "20px", 
                    fontSize: "12px", 
                    fontWeight: 500
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 단점 */}
          {reviewData.cons && reviewData.cons.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", fontWeight: 600 }}>단점</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {reviewData.cons.map((item, idx) => (
                  <span key={idx} style={{ 
                    padding: "6px 12px", 
                    backgroundColor: "#fee2e2", 
                    color: "#991b1b", 
                    borderRadius: "20px", 
                    fontSize: "12px", 
                    fontWeight: 500
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
            리뷰 정보가 없습니다.
          </div>
        )}
        </div>

        {/* 기존 차량 상세 모달 (오른쪽) */}
        <div style={{ backgroundColor: "#fff", width: "600px", maxHeight: "90vh", borderRadius: "16px", padding: "30px 20px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#888", zIndex: 10 }}>✕</button>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>{carName}</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>{brandName}</p>

          <div style={{ margin: "15px 0", height: "180px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={carName || "차량 이미지"} 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", cursor: "pointer", transition: "transform 0.2s" }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.transform = "scale(1)";
                }}
                onClick={() => {
                  const mainImageIndex = allImages.findIndex(img => img.url === imageUrl);
                  setLightboxIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
                  setLightboxOpen(true);
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#f5f5f5", borderRadius: "10px", display:"flex", alignItems:"center", justifyContent:"center", color: "#aaa"}}>이미지 준비중</div>
            )}
            <button onClick={handleToggleLike} style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(255, 255, 255, 0.8)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 10 }}>
              <HeartIcon filled={isLiked} />
            </button>
          </div>

          {/* 제원 정보 섹션 */}
          <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", textAlign: "left" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#333" }}>제원 정보</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>구매 가격</p>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#0070f3" }}>
                  {formatPrice(displayPrice)} {car?.maxPrice ? `~ ${formatPrice(car.maxPrice)}` : ""}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>출시일</p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                  {specs.release_date || "정보 없음"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>배기량</p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                  {formatDisplacement(specs.displacement_range)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>복합연비</p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                  {formatFuelEfficiency(specs.fuel_efficiency_range)}
                </p>
              </div>
            </div>
          </div>

          {/* 색상 이미지 갤러리 */}
          {loading ? (
            <div style={{ marginTop: "20px", padding: "20px", textAlign: "center", color: "#999" }}>로딩 중...</div>
          ) : (
            <>
              {renderImageGallery(
                carDetail?.color_images || [],
                colorImages,
                colorImagesCount,
                setColorImagesCount,
                "차량별 색상"
              )}
              {renderImageGallery(
                carDetail?.exterior_images || [],
                exteriorImages,
                exteriorImagesCount,
                setExteriorImagesCount,
                "외관 색상"
              )}
              {renderImageGallery(
                carDetail?.interior_images || [],
                interiorImages,
                interiorImagesCount,
                setInteriorImagesCount,
                "내관 색상"
              )}
            </>
          )}

          <button style={{ marginTop: "20px", width: "100%", padding: "12px 0", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }} onClick={handleGoToQuoteResult}>
            상세 견적 확인하기
          </button>
        </div>
        </div>
      </div>
      
      {/* 이미지 라이트박스 */}
      {lightboxOpen && allImages.length > 0 && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            backgroundColor: "rgba(0, 0, 0, 0.95)", 
            zIndex: 2000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 전파 방지
            setLightboxOpen(false);
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // 이벤트 전파 방지
              setLightboxOpen(false);
            }}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "24px",
              zIndex: 2001,
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ✕
          </button>
          
          {/* 이전 버튼 */}
          {allImages.length > 1 && (
            <button
              onClick={handlePrevImage}
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                fontSize: "32px",
                fontWeight: "bold",
                zIndex: 2001,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = "rgba(255, 255, 255, 0.2)";
              }}
            >
              ‹
            </button>
          )}
          
          {/* 이미지 */}
          <div 
            style={{ 
              maxWidth: "90vw", 
              maxHeight: "90vh", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: "12px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={allImages[lightboxIndex]?.url} 
              alt={allImages[lightboxIndex]?.name || "이미지"}
              style={{ 
                maxWidth: "100%", 
                maxHeight: "85vh", 
                objectFit: "contain",
                borderRadius: "8px"
              }}
            />
            {allImages[lightboxIndex]?.colorName && (
              <div style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>
                {allImages[lightboxIndex].colorName}
              </div>
            )}
            {allImages.length > 1 && (
              <div style={{ color: "#fff", fontSize: "14px", opacity: 0.8 }}>
                {lightboxIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
          
          {/* 다음 버튼 */}
          {allImages.length > 1 && (
            <button
              onClick={handleNextImage}
              style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                fontSize: "32px",
                fontWeight: "bold",
                zIndex: 2001,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = "rgba(255, 255, 255, 0.2)";
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

