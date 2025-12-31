"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";

// ✅ 타입 정의
interface OptionDetail {
  name: string;
  price: number;
}

interface CarInfo {
  manufacturer: string;
  model: string;
  trim: string;
  price: number; // 차량 기본가
  image: string;
  options: (string | OptionDetail)[];
  specs?: Record<string, any>;
  engine?: string;
  power?: string;
  fuel?: string;
  [key: string]: any;
}

interface QuoteData {
  _id: string;
  type: string;
  createdAt: string;
  totalPrice: number; // 전체 견적 합계
  cars: CarInfo[];
}

// [수정됨] 하드코딩된 IP 제거 -> 프록시 경로 사용
// 실제로는 next.config.mjs 설정을 통해 3003번 포트(견적 서비스)로 연결됩니다.
const API_BASE = "/api";

export default function MyPageQuotes() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // 1. 저장 성공 토스트 메시지 처리
    const savedFlag = localStorage.getItem("quote_saved");
    if (savedFlag === "1") {
      setToastMessage("견적함에 저장되었습니다.");
      localStorage.removeItem("quote_saved");
      setTimeout(() => setToastMessage(""), 2500);
    }

    // 2. 사용자 ID 확인
    const userSocialId = localStorage.getItem("user_social_id");
    if (!userSocialId) {
      setLoading(false);
      return;
    }

    // 3. 견적 목록 불러오기 (백엔드 API 호출)
    // 요청 주소: /api/estimate/list -> (프록시) -> 3003번/estimate/list
    fetch(`${API_BASE}/estimate/list?userId=${userSocialId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuotes(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("견적 목록 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  // ✅ 폰트 로드 (public/fonts/NanumGothic.ttf 필요)
  const loadFont = async (): Promise<string | null> => {
    try {
      const response = await fetch("/fonts/NanumGothic.ttf");
      if (!response.ok) {
        console.warn("폰트 파일을 찾을 수 없습니다:", response.status);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      // Base64 인코딩 개선
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error("폰트 로드 실패:", error);
      return null;
    }
  };

  // ✅ [핵심] 고퀄리티 PDF 생성 로직 (가격 가독성 및 상세 제원)
  const handleDownloadPDF = async (quote: QuoteData) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const fontData = await loadFont();
      let fontLoaded = false;

      if (fontData) {
        try {
          doc.addFileToVFS("NanumGothic.ttf", fontData);
          doc.addFont("NanumGothic.ttf", "NanumGothic", "normal");
          // bold는 normal과 동일한 파일 사용 (TTF 파일이 bold를 포함하는 경우)
          doc.addFont("NanumGothic.ttf", "NanumGothic", "bold");
          doc.setFont("NanumGothic", "normal");
          fontLoaded = true;
          console.log("한글 폰트가 성공적으로 로드되었습니다.");
        } catch (fontError) {
          console.error("폰트 등록 실패:", fontError);
          // 폰트 등록 실패 시 기본 폰트 사용
        }
      } else {
        console.warn("폰트 데이터를 로드할 수 없어 기본 폰트를 사용합니다.");
      }

      let currentY = 25;
      const marginX = 20;
      const pageWidth = 210;

      const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > 275) {
          doc.addPage();
          currentY = 25;
          return true;
        }
        return false;
      };

      // 1. 헤더
      doc.setFontSize(24);
      doc.setTextColor(0, 82, 255);
      if (fontLoaded) doc.setFont("NanumGothic", "bold");
      doc.text("ALPHACAR PREMIUM QUOTE REPORT", marginX, currentY);
      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(150);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      const issueDate = new Date().toLocaleDateString("ko-KR");
      doc.text(`발행일: ${issueDate} | 견적 번호: ${quote._id}`, marginX, currentY);
      currentY += 5;
      doc.setDrawColor(0, 82, 255);
      doc.setLineWidth(1);
      doc.line(marginX, currentY, 190, currentY);
      currentY += 15;

      for (const car of quote.cars) {
        // 상세 데이터가 없을 경우를 대비해 실시간 Fetch 시도 (Specs 확보용)
        let fullSpecs = car.specs || {};
        try {
          const res = await fetch(`${API_BASE}/vehicles/detail?trimId=${encodeURIComponent(car.trim)}`);
          const detail = await res.json();
          if (detail?.selectedTrimSpecs) fullSpecs = detail.selectedTrimSpecs;
        } catch (e) { 
          console.warn("Detail Specs fetch failed"); 
        }

        // 2. 차량 타이틀 및 기본가
        doc.setFontSize(22);
        doc.setTextColor(0);
        if (fontLoaded) doc.setFont("NanumGothic", "bold");
        doc.text(`${car.manufacturer} ${car.model}`, marginX, currentY);
        currentY += 10;
        doc.setFontSize(14);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.setTextColor(80);
        doc.text(`선택 트림: ${car.trim}`, marginX, currentY);
        currentY += 12;
        doc.setFillColor(245, 247, 255);
        doc.rect(marginX, currentY - 5, 170, 12, "F");
        doc.setFontSize(13);
        doc.setTextColor(0, 82, 255);
        if (fontLoaded) doc.setFont("NanumGothic", "bold");
        doc.text("차량 기본 가격", marginX + 5, currentY + 3);
        doc.text(`${car.price.toLocaleString()}원`, 185, currentY + 3, { align: "right" });
        currentY += 18;

        // 3. 선택 옵션 리스트 (개별 가격 명시)
        doc.setFontSize(14);
        doc.setTextColor(0);
        if (fontLoaded) doc.setFont("NanumGothic", "bold");
        doc.text("■ 선택 옵션 상세 내역", marginX, currentY);
        currentY += 10;

        let optionSum = 0;
        if (car.options && car.options.length > 0) {
          car.options.forEach((opt: any) => {
            const name = typeof opt === 'string' ? opt : opt.name;
            const price = typeof opt === 'string' ? 0 : (opt.price || 0);
            optionSum += price;
            const optText = `• ${name}`;
            const priceText = price > 0 ? `+${price.toLocaleString()}원` : "기본포함";

            checkPageBreak(8);
            doc.setFontSize(11);
            doc.setTextColor(60);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            doc.text(optText, marginX + 5, currentY);
            doc.text(priceText, 185, currentY, { align: "right" });
            currentY += 8;
          });
        } else {
          doc.setFontSize(11);
          doc.setTextColor(150);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text("• 선택된 추가 옵션이 없습니다.", marginX + 5, currentY);
          currentY += 8;
        }

        // 해당 차량 합계
        currentY += 5;
        doc.setDrawColor(230);
        doc.line(marginX + 5, currentY, 185, currentY);
        currentY += 8;
        doc.setFontSize(14);
        doc.setTextColor(0);
        if (fontLoaded) doc.setFont("NanumGothic", "bold");
        doc.text(`${car.model} 견적 합계`, marginX + 5, currentY);
        doc.text(`${(car.price + optionSum).toLocaleString()}원`, 185, currentY, { align: "right" });
        currentY += 20;

        // 4. 상세 제원 정보 (2열 그리드 + 자동 줄바꿈)
        checkPageBreak(40);
        doc.setFontSize(14);
        if (fontLoaded) doc.setFont("NanumGothic", "bold");
        doc.text("■ 차량 상세 제원 정보", marginX, currentY);
        currentY += 10;

        const specMap = {
          "엔진형식": car.engine || fullSpecs["엔진형식"] || "정보 없음",
          "최고출력": car.power || fullSpecs["최고출력"] || "정보 없음",
          "복합연비": car.fuel || fullSpecs["복합연비"] || "정보 없음",
          ...fullSpecs
        };

        const specEntries = Object.entries(specMap).filter(([k, v]) => v && String(v).trim() !== "" && k !== "_id");
        doc.setFontSize(9);

        for (let i = 0; i < specEntries.length; i += 2) {
          const item1 = specEntries[i];
          const item2 = specEntries[i+1];
          // 줄바꿈 대응 높이 계산
          const val1Lines = doc.splitTextToSize(String(item1[1]), 45);
          const val2Lines = item2 ? doc.splitTextToSize(String(item2[1]), 45) : [];
          const rowHeight = Math.max(val1Lines.length, val2Lines.length) * 5 + 5;
          checkPageBreak(rowHeight);
          doc.setFillColor(250, 250, 250);
          doc.rect(marginX, currentY - 5, 180, rowHeight, "F");
          // 1열
          doc.setTextColor(130);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text(item1[0], marginX + 3, currentY);
          doc.setTextColor(0);
          if (fontLoaded) doc.setFont("NanumGothic", "bold");
          doc.text(val1Lines, marginX + 35, currentY);
          // 2열
          if (item2) {
            doc.setTextColor(130);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            doc.text(item2[0], marginX + 93, currentY);
            doc.setTextColor(0);
            if (fontLoaded) doc.setFont("NanumGothic", "bold");
            doc.text(val2Lines, marginX + 125, currentY);
          }
          currentY += rowHeight;
        }

        currentY += 15;
        doc.setDrawColor(0, 82, 255);
        doc.setLineWidth(0.5);
        doc.line(marginX, currentY, 190, currentY);
        currentY += 20;
      }

      // 5. 최종 견적 합계 (푸터)
      checkPageBreak(30);
      currentY = 275;
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72);
      if (fontLoaded) doc.setFont("NanumGothic", "bold");
      doc.text(`최종 견적 총액: ${quote.totalPrice.toLocaleString()}원`, 190, currentY, { align: "right" });

      doc.save(`Alphacar_Detailed_Quote_${quote._id.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다. 데이터를 확인해주세요.");
    }
  };

  // ✅ [수정됨] 견적 영구 삭제 함수
  const handleDeleteQuote = async (quoteId: string) => {
    const ok = window.confirm("정말 이 견적을 삭제하시겠습니까? (복구 불가)");
    if (!ok) return;

    try {
      // 1. 백엔드에 삭제 요청 보내기
      // 요청 주소: /api/estimate/{id}
      const res = await fetch(`${API_BASE}/estimate/${quoteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 2. 성공 시 화면에서도 제거 (새로고침 안 해도 되도록)
        setQuotes((prev) => prev.filter((q) => q._id !== quoteId));
        // alert("삭제되었습니다."); // (선택사항)
      } else {
        alert("삭제 실패: 서버 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("삭제 요청 중 에러:", error);
      alert("삭제 중 문제가 발생했습니다.");
    }
  };

  // 숫자 포맷팅 함수
  const formatPrice = (num: number) => (num ? num.toLocaleString() + "원" : "0원");

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "40px auto 80px",
        padding: "0 20px",
      }}
    >
      {/* 토스트 메시지 */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#222",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "999px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px" }}>
          견적함
        </h1>
        <p style={{ fontSize: "14px", color: "#777" }}>
          저장한 차량 견적들을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
          로딩 중입니다...
        </div>
      ) : quotes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            borderRadius: "24px",
            background: "#fafafa",
            border: "1px dashed #ddd",
          }}
        >
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "8px" }}>
            아직 저장된 견적이 없습니다.
          </p>
          <p style={{ fontSize: "13px", color: "#999" }}>
            마음에 드는 차량을 찾아 견적을 저장해보세요.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {quotes.map((quote) => {
            // 날짜 포맷팅
            const dateStr = new Date(quote.createdAt).toLocaleDateString(
              "ko-KR",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );

            // 개별 견적 vs 비교 견적 구분
            const isCompare = quote.type === "compare";
            const carList = quote.cars || [];

            return (
              <div
                key={quote._id}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                }}
              >
                {/* 상단 정보: 타입 & 날짜 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "16px",
                    borderBottom: "1px solid #f5f5f5",
                    paddingBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: isCompare ? "#0066ff" : "#333",
                    }}
                  >
                    {isCompare ? "비교 견적" : "개별 견적"}
                  </span>
                  <span>{dateStr} 저장됨</span>
                </div>

                {/* 차량 리스트 영역 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isCompare ? "1fr 1fr" : "1fr",
                    gap: "24px",
                  }}
                >
                  {carList.map((car, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        borderRight:
                          isCompare && cIdx === 0 ? "1px solid #f0f0f0" : "none",
                        paddingRight: isCompare && cIdx === 0 ? "24px" : "0",
                      }}
                    >
                      {/* 차량 이미지 */}
                      <div
                        style={{
                          width: "100px",
                          height: "70px",
                          borderRadius: "10px",
                          background: "#f9f9f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {car.image ? (
                          <img
                            src={car.image}
                            alt={car.model}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span
                            style={{ fontSize: "11px", color: "#ccc" }}
                          >
                            No Image
                          </span>
                        )}
                      </div>

                      {/* 차량 정보 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginBottom: "2px",
                          }}
                        >
                          {car.manufacturer}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            marginBottom: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {car.model}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            marginBottom: "4px",
                          }}
                        >
                          {car.trim}
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#1d4ed8",
                          }}
                        >
                          {formatPrice(car.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 하단 옵션 요약 */}
                <div style={{ marginTop: "20px" }}>
                  {carList.map((car, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        background: "#f9fafb",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginTop: cIdx > 0 ? "8px" : "0",
                      }}
                    >
                      <span
                        style={{ fontWeight: 600, marginRight: "6px" }}
                      >
                        [{car.model}] 옵션:
                      </span>
                      {car.options && car.options.length > 0
                        ? car.options.map((opt: any) => typeof opt === 'string' ? opt : opt.name).join(", ")
                        : "선택 옵션 없음"}
                    </div>
                  ))}
                </div>

                {/* 총 견적가 + 삭제 버튼 */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px dashed #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* 버튼 그룹: PDF 다운로드 + 삭제 */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(quote)}
                      style={{
                        fontSize: "12px",
                        borderRadius: "999px",
                        border: "1px solid #0052FF",
                        backgroundColor: "#0052FF",
                        color: "#fff",
                        padding: "4px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      PDF 저장
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(quote._id)}
                      style={{
                        fontSize: "12px",
                        borderRadius: "999px",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                        color: "#666",
                        padding: "4px 12px",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  {/* 총 견적가 */}
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#888",
                        marginRight: "8px",
                      }}
                    >
                      총 예상 견적가
                    </span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#e11d48",
                      }}
                    >
                      {formatPrice(quote.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
