"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

// ✅ TypeScript 인터페이스 정의 (API 데이터 타입 유연하게 처리)
interface Option {
  _id?: string;
  id?: string;
  name?: string;
  option_name?: string;
  price?: number;
  option_price?: number;
  [key: string]: any;
}

interface VehicleData {
  _id?: string;
  id?: string;
  name?: string; // 트림명
  vehicle_name?: string;
  model_name?: string;
  brand_name?: string;
  manufacturer?: string;
  base_price: number;
  price?: number;
  image_url?: string;
  main_image?: string;
  options?: Option[];
  selectedTrimSpecs?: Record<string, any> | null; // 선택된 트림의 전체 specifications
  [key: string]: any;
}

// 백엔드 API 주소
// ✅ Next.js API Route를 통해 라우팅되도록 /api 사용
const API_BASE = "/api";

// [유틸] 견고한 HTTP 응답 처리
const handleApiResponse = async (res: Response) => {
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch (e) {
      errorData = { message: res.statusText || '서버 응답 오류', status: res.status };
    }
    throw new Error(errorData.message || `API 요청 실패 (Status: ${res.status})`);
  }
  return res.json();
};

// ---------------- [1] 공통 컴포넌트: 차량 선택 박스 ----------------
interface CarSelectorProps {
  title: string;
  onSelectComplete: (trimId: string, modelName?: string, baseTrimId?: string) => void;
  onReset?: () => void;
  resetSignal: number;
}

function CarSelector({ title, onSelectComplete, onReset, resetSignal }: CarSelectorProps) {
  const [makerId, setMakerId] = useState("");
  const [modelId, setModelId] = useState("");
  const [baseTrimId, setBaseTrimId] = useState("");
  const [trimId, setTrimId] = useState("");

  const [makers, setMakers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [baseTrims, setBaseTrims] = useState<any[]>([]);
  const [trims, setTrims] = useState<any[]>([]);

  const [trimName, setTrimName] = useState("");

  // 1. 초기 로딩
  useEffect(() => {
    fetch(`${API_BASE}/vehicles/makers`)
      .then(handleApiResponse)
      .then((data) => {
        if (Array.isArray(data)) setMakers(data);
      })
      .catch((err) => {
        console.error("제조사 로딩 실패:", err);
        setMakers([]);
      });
  }, []);

  // 2. 초기화 신호
  const prevResetSignalRef = useRef(0);
  useEffect(() => {
    if (resetSignal > prevResetSignalRef.current) {
      setMakerId(""); setModelId(""); setBaseTrimId(""); setTrimId("");
      setTrimName("");
      setModels([]); setBaseTrims([]); setTrims([]);
      prevResetSignalRef.current = resetSignal;
      // onReset은 호출하지 않음 (무한 루프 방지)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const handleReset = () => {
    setMakerId(""); setModelId(""); setBaseTrimId(""); setTrimId("");
    setTrimName("");
    setModels([]); setBaseTrims([]); setTrims([]);
    if (onReset) onReset();
  };

  // 3. 핸들러들
  const handleMakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMakerId = e.target.value;
    setMakerId(newMakerId);
    setModelId(""); setBaseTrimId(""); setTrimId(""); setTrimName("");
    setModels([]); setBaseTrims([]); setTrims([]);

    if (!newMakerId) return;

    fetch(`${API_BASE}/vehicles/models?makerId=${encodeURIComponent(newMakerId)}`)
      .then(handleApiResponse)
      .then((data) => {
        if (Array.isArray(data)) {
          // 중복 제거
          const uniqueModels = Array.from(new Map(data.map((m: any) => [m.vehicle_name || m.model_name, m])).values());
          setModels(uniqueModels);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else setModels([]);
      })
      .catch((err) => console.error("모델 로딩 실패:", err));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    setModelId(newModelId);
    setBaseTrimId(""); setTrimId(""); setTrimName("");
    setBaseTrims([]); setTrims([]);

    if (!newModelId) return;

    fetch(`${API_BASE}/vehicles/base-trims?modelId=${newModelId}`)
      .then(handleApiResponse)
      .then((data) => {
        if (Array.isArray(data)) {
          setBaseTrims(data);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else setBaseTrims([]);
      })
      .catch((err) => console.error("기본 트림 로딩 실패:", err));
  };

  const handleBaseTrimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBaseTrimId = e.target.value; // base_trim_name
    setBaseTrimId(newBaseTrimId);
    setTrimId(""); setTrimName("");
    setTrims([]);

    if (!newBaseTrimId || !modelId) return;

    // 현재 선택된 제조사와 차종 정보 가져오기
    const selectedModel = models.find((m: any) => m._id === modelId);
    const selectedMaker = makers.find((m: any) => m._id === makerId);
    const modelName = selectedModel?.model_name || selectedModel?.name || "";
    const brandName = selectedMaker?.name || "";
    const foundBaseTrim = baseTrims.find((bt: any) => 
      (bt._id === newBaseTrimId || bt.id === newBaseTrimId || bt.name === newBaseTrimId || bt.base_trim_name === newBaseTrimId)
    );
    const baseTrimName = foundBaseTrim?.base_trim_name || foundBaseTrim?.name || newBaseTrimId;
    
    console.log("[비교견적 세부 트림] 선택 정보:", {
      newBaseTrimId,
      foundBaseTrim,
      baseTrimName,
      modelName,
      brandName,
      modelId,
      baseTrimsCount: baseTrims.length
    });

    // 기본 트림 선택 후 세부 트림 목록 가져오기
    // ⚠️ 백엔드는 modelId 파라미터를 base_trim_name으로 사용함
    // 따라서 baseTrimName을 modelId로 전달해야 함
    const queryParams = new URLSearchParams();
    if (baseTrimName) {
      queryParams.append('modelId', baseTrimName); // baseTrimName을 modelId로 전달
    } else if (modelId) {
      queryParams.append('modelId', modelId); // fallback
    }

    const url = `${API_BASE}/vehicles/trims?${queryParams.toString()}`;
    console.log("[세부 트림] API 호출:", url);
    fetch(url)
      .then(handleApiResponse)
      .then((data) => {
        console.log("[세부 트림] API 응답:", data);
        if (Array.isArray(data)) {
          console.log("[세부 트림] 트림 개수:", data.length);
          setTrims(data);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else {
          console.warn("[세부 트림] 응답이 배열이 아님:", data);
          setTrims([]);
        }
      })
      .catch((err) => {
        console.error("세부 트림 로딩 실패:", err);
        console.error("세부 트림 로딩 실패 - 상세:", {
          message: err.message,
          stack: err.stack,
          url: url,
          queryParams: queryParams.toString()
        });
        alert(`세부 트림을 불러오는데 실패했습니다.\n에러: ${err.message || '알 수 없는 오류'}`);
        setTrims([]);
      });
  };

  const handleTrimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrimId = e.target.value;
    const index = e.target.selectedIndex;
    setTrimId(newTrimId);
    if (index >= 0) setTrimName(e.target.options[index].text);
  };

  const handleCompleteClick = () => {
    if (!trimId) {
      alert("세부트림까지 모두 선택해주세요.");
      return;
    }
    if (onSelectComplete) {
      // trimId는 _id 또는 trim_name일 수 있음
      // _id를 우선 사용하여 고유성 보장
      const selectedModel = models.find((m: any) => m._id === modelId);
      const modelName = selectedModel?.model_name || selectedModel?.name || "";
      onSelectComplete(trimId, modelName, baseTrimId); // _id 또는 trim_name을 전달, baseTrimId도 함께 전달
    }
  };

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>{title}</div>
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>제조사 → 차종 → 기본트림 → 세부트림 순서로 선택</div>

      {/* 내부 요소도 반응형 그리드 (4단계 필터링을 항상 4열로 표시) */}
      <div className="filter-grid" style={{ gap: "16px" }}>

        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>제조사</div>
          <select size={8} value={makerId || ""} onChange={handleMakerChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>- 선택 -</option>
            {makers.length === 0 && <option disabled>로딩중...</option>}
            {makers.map((m, idx) => (
              <option key={m._id || `m-${idx}`} value={m._id || m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>차종</div>
          <select size={8} value={modelId || ""} onChange={handleModelChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>{makerId ? "- 선택 -" : "-"}</option>
            {models.length === 0 ? (
               <option value="" disabled style={{ color: "#ccc" }}>{makerId ? "없음" : "-"}</option>
            ) : (
               models.map((m, idx) => (
                 <option key={m._id || `mo-${idx}`} value={m._id}>{m.model_name}</option>
               ))
            )}
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>기본트림</div>
          <select size={8} value={baseTrimId || ""} onChange={handleBaseTrimChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>{modelId ? "- 선택 -" : "-"}</option>
             {baseTrims.length === 0 ? (
               <option value="" disabled style={{ color: "#ccc" }}>{modelId ? "없음" : "-"}</option>
            ) : (
               baseTrims.map((t, idx) => (
                 <option key={t._id || `base-${idx}`} value={t._id || t.name}>{t.name || t.base_trim_name}</option>
               ))
            )}
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>세부트림</div>
          <select size={8} value={trimId || ""} onChange={handleTrimChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>{baseTrimId ? "- 선택 -" : "-"}</option>
             {trims.length === 0 ? (
               <option value="" disabled style={{ color: "#ccc" }}>{baseTrimId ? "없음" : "-"}</option>
            ) : (
               trims.map((t, idx) => {
                 const uniqueKey = t._id ? t._id : `trim-${idx}`;
                 // trim_name을 우선 사용 (고유성 보장), _id는 lineup_id일 수 있어서 부정확할 수 있음
                 // trim_name이 고유 식별자로 사용됨
                 const val = t.trim_name || t.name || t._id || t.lineup_id;
                 return <option key={uniqueKey} value={val}>{t.name || t.trim_name}</option>;
               })
            )}
          </select>
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "13px", color: "#333", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          선택: <span style={{ fontWeight: 600, color: "#2563eb" }}>{trimName || "-"}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={handleReset} style={btnResetStyle}>초기화</button>
          <button onClick={handleCompleteClick} style={btnSearchStyle}>선택 완료</button>
        </div>
        
      </div>
    </div>
  );
}

// ---------------- [2] 하단 컴포넌트: 옵션 카드 ----------------
interface CarOptionSelectCardProps {
  data: VehicleData;
  selectedSet: Set<string>;
  onToggle: (id: string) => void;
}

function CarOptionSelectCard({ data, selectedSet, onToggle }: CarOptionSelectCardProps) {
  // base_price가 없으면 price를 사용하거나 0으로 설정 (병합된 데이터 사용)
  const basePrice = data.base_price || data.price || 0;
  
  const optionsTotal = (data.options || []).reduce((sum, opt, idx) => {
    // 체크박스에서 사용하는 ID와 동일하게 생성
    const id = opt._id || String(idx);
    // price와 option_price 중 존재하는 값을 사용
    const price = opt.price || opt.option_price || 0;
    if (selectedSet.has(id)) {
      return sum + price;
    }
    return sum;
  }, 0);
  
  const finalPrice = basePrice + optionsTotal;
  
  // 제원 정보 추출 - 선택된 트림의 전체 specifications
  const selectedTrimSpecs = data.selectedTrimSpecs || {};
  
  // 값이 있는 항목만 필터링
  const validSpecs = Object.entries(selectedTrimSpecs).filter(([key, value]) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px 28px 20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ width: "100%", height: "140px", marginBottom: "16px", borderRadius: "12px", backgroundColor: data.image_url ? "transparent" : "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {data.image_url || data.main_image ? ( // main_image 필드도 확인
            <img src={data.image_url || data.main_image} alt={data.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <span style={{ color: "#aaa", fontSize: "13px" }}>이미지 준비중</span>
          )}
        </div>
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{data.manufacturer || data.brand_name} {data.model_name || data.vehicle_name}</div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "#111" }}>{data.name || data.trim_name}</div>
      </div>

      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "14px 18px", fontSize: "14px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#555" }}>기본 차량가</span>
        <span style={{ fontWeight: 700, color: "#333" }}>{basePrice.toLocaleString()}원</span>
      </div>

      <div style={{ flex: "0 0 auto", marginBottom: "20px", minHeight: "180px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", borderBottom: "2px solid #eee", paddingBottom: "6px" }}>
            옵션 선택 ({data.options?.length || 0})
        </div>
        <div style={{ maxHeight: "120px", overflowY: "auto", paddingRight: "4px", minHeight: "120px" }}>
          {(!data.options || data.options.length === 0) && (
            <div style={{ padding: "12px", textAlign: "center", color: "#999", fontSize: "12px" }}>선택 가능한 옵션이 없습니다.</div>
          )}
          {(data.options || []).map((opt, idx) => {
            const safeId = opt._id || String(idx); // 개별 견적 페이지와 동일한 ID 생성 방식
            const isChecked = selectedSet.has(safeId);
            const price = opt.price || opt.option_price || 0;
            return (
              <label
                key={safeId}
                style={{
                  display: "flex", alignItems: "center", padding: "6px 10px", marginBottom: "4px", borderRadius: "6px",
                  cursor: "pointer", transition: "all 0.2s",
                  backgroundColor: isChecked ? "#eff6ff" : "#fff",
                  border: isChecked ? "1px solid #bfdbfe" : "1px solid #eee"
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(safeId)}
                  style={{ marginRight: "10px", width: "14px", height: "14px", accentColor: "#2563eb", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: isChecked ? 600 : 400 }}>{opt.name || opt.option_name}</div>
                </div>
                <span style={{ fontSize: "11px", color: isChecked ? "#1d4ed8" : "#666", fontWeight: isChecked ? 700 : 400 }}>
                    +{price.toLocaleString()}원
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ backgroundColor: "#111", color: "#fff", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flex: "0 0 auto" }}>
        <span style={{ fontSize: "14px", opacity: 0.9 }}>최종 견적가</span>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#fbbf24" }}>{finalPrice.toLocaleString()}원</span>
      </div>

      {/* 제원 정보 섹션 - 선택된 트림의 전체 specifications */}
      {validSpecs.length > 0 && (
        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee", flex: "0 0 auto" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#333" }}>제원 정보</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {validSpecs.map(([key, value]) => (
              <div key={key}>
                <p style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>{key}</p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- [3] 내부 로직 컴포넌트 (useSearchParams 사용) ----------------
function CompareQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const MAX_CARS = 5;
  const [carsData, setCarsData] = useState<(VehicleData | null)[]>([null, null]); // 초기값: 2대
  const [carsOpts, setCarsOpts] = useState<Set<string>[]>([new Set(), new Set()]); // 초기값: 2대의 옵션
  const [resetSignals, setResetSignals] = useState<number[]>([0, 0]); // 각 차량별 리셋 신호

  // ✅ 데이터 추출 및 병합 로직을 포함한 fetch 함수
  const fetchCarDetail = async (trimId: string, modelName?: string, baseTrimId?: string): Promise<VehicleData | null> => {
    try {
      // 차종 이름이 있으면 함께 전달
      const queryParams = new URLSearchParams({ trimId });
      if (modelName) {
        queryParams.append('modelName', modelName);
      }
      if (baseTrimId) {
        queryParams.append('baseTrimId', baseTrimId);
      }
      const res = await fetch(`${API_BASE}/vehicles/detail?${queryParams.toString()}`);
      if (!res.ok) {
          let errorMsg = `조회 실패 (${res.status})`;
          try {
              const errJson = await res.json();
              if (errJson.message) errorMsg = errJson.message;
          } catch(e) {}
          throw new Error(errorMsg);
      }
      
      const rawVehicleData = await res.json();

      // 1. 선택된 트림 찾기
      let selectedTrim = null;
      const trims = rawVehicleData.trims || [];

      if (trims.length > 0) {
          const decodedTrimId = trimId.includes('%') ? decodeURIComponent(trimId) : trimId;
          // "Reserve A/T:1" 형식에서 실제 트림 이름만 추출 (":숫자" 제거)
          const trimNameOnly = decodedTrimId.split(':')[0].trim();

          console.log("🚗 [비교 페이지] 트림 찾기:", { trimId, decodedTrimId, trimNameOnly, trimsCount: trims.length, modelName });

          // A. trim_name으로 먼저 찾기 (가장 정확한 매칭, 고유성 보장)
          // trim_name이 세부 트림 선택 시 사용된 값이므로 우선 매칭
          selectedTrim = trims.find((t: any) => 
            t.trim_name === trimId || 
            t.trim_name === decodedTrimId || 
            t.trim_name === trimNameOnly ||
            String(t.trim_name) === String(trimId) ||
            String(t.trim_name) === String(decodedTrimId)
          ) || null;

          // B. name으로 찾기
          if (!selectedTrim) {
              selectedTrim = trims.find((t: any) => 
                t.name === trimId || 
                t.name === decodedTrimId || 
                t.name === trimNameOnly ||
                String(t.name) === String(trimId) ||
                String(t.name) === String(decodedTrimId)
              ) || null;
          }

          // C. _id로 찾기 (MongoDB ObjectId 포함)
          if (!selectedTrim) {
              selectedTrim = trims.find((t: any) => 
                t._id === trimId || 
                t._id === decodedTrimId ||
                String(t._id) === String(trimId) ||
                String(t._id) === String(decodedTrimId)
              ) || null;
          }

          // D. trim_id로 찾기
          if (!selectedTrim) {
              selectedTrim = trims.find((t: any) => 
                t.trim_id === trimId || 
                t.trim_id === decodedTrimId ||
                String(t.trim_id) === String(trimId) ||
                String(t.trim_id) === String(decodedTrimId)
              ) || null;
          }

          // E. Fallback: 여전히 못 찾았다면 첫 번째 트림을 기본값으로 사용
          if (!selectedTrim) {
              console.warn("🚗 [비교 페이지] 트림을 찾지 못해 첫 번째 트림 사용:", { trimId, decodedTrimId, trimsCount: trims.length });
              selectedTrim = trims[0];
          } else {
              console.log("🚗 [비교 페이지] 트림 찾기 성공:", { trimId, foundTrim: selectedTrim.trim_name || selectedTrim.name });
          }
      }
      
      if (!selectedTrim) {
          console.warn("트림 데이터가 없어 기본 차량 정보만 표시됩니다.");
          return rawVehicleData; // 트림이 없어도 기본적인 Vehicle 정보만 반환
      }

      // 2. Vehicle + Trim 데이터 병합 (Card 컴포넌트가 기대하는 flat 구조 생성)
      const mergedData: VehicleData = {
          ...rawVehicleData, // 상위 정보 (vehicle_name, brand_name, _id, etc.)
          name: selectedTrim.trim_name, // ✅ 트림명
          base_price: selectedTrim.price, // ✅ 트림 가격
          options: selectedTrim.options || [], // ✅ 옵션 배열
          image_url: rawVehicleData.main_image || rawVehicleData.image_url, // 이미지 URL 통합
          imageUrl: rawVehicleData.main_image || rawVehicleData.image_url, // ✅ 메인페이지와 호환을 위한 imageUrl 필드 추가
          main_image: rawVehicleData.main_image || rawVehicleData.image_url, // ✅ 추가 필드
          selectedTrimSpecs: rawVehicleData.selectedTrimSpecs || null, // ✅ 선택된 트림의 전체 specifications
      };
      
      return mergedData;

    } catch (err: any) {
      console.error(err);
      alert(`차량 정보를 불러오는데 실패했습니다.\n사유: ${err.message}`);
      return null;
    }
  };

  useEffect(() => {
    const car1_trimId = searchParams.get("car1_trimId");
    const car1_modelName = searchParams.get("car1_modelName");
    const car1_options = searchParams.get("car1_options");

    if (car1_trimId) {
      console.log("🚗 [비교 페이지] car1 데이터 로드:", { car1_trimId, car1_modelName, car1_options });
      fetchCarDetail(car1_trimId, car1_modelName || undefined).then((data) => {
        if (data) {
          setCarsData(prev => {
            const newCars = [...prev];
            newCars[0] = data;
            return newCars;
          });

          // 옵션 ID 문자열을 파싱하여 Set으로 변환
          if (car1_options) {
            const optionIds = car1_options.split(",").filter(id => id.trim() !== "");
            // 옵션 ID를 실제 옵션 데이터의 _id와 매칭
            const selectedOpts = new Set<string>();
            if (data.options && Array.isArray(data.options)) {
              data.options.forEach((opt: any, idx: number) => {
                // 개별 견적 페이지와 동일한 ID 생성 방식: opt._id || idx
                const optId = opt._id || idx;
                const optIdStr = String(optId);
                const opt_idStr = opt._id ? String(opt._id) : "";
                const idxStr = String(idx);

                // URL에서 전달된 ID와 옵션의 ID, _id, 인덱스를 모두 비교
                if (optionIds.includes(optIdStr) ||
                    (opt_idStr && optionIds.includes(opt_idStr)) ||
                    optionIds.includes(idxStr)) {
                  selectedOpts.add(String(optId));
                }
              });
            }
            setCarsOpts(prev => {
              const newOpts = [...prev];
              newOpts[0] = selectedOpts;
              return newOpts;
            });
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 차량 추가 함수
  const handleAddCar = useCallback(() => {
    if (carsData.length >= MAX_CARS) {
      alert(`최대 ${MAX_CARS}대까지 비교할 수 있습니다.`);
      return;
    }
    // 상태 업데이트를 한 번에 처리
    setCarsData(prev => {
      if (prev.length >= MAX_CARS) return prev;
      const newCars = [...prev];
      newCars.push(null);
      return newCars;
    });
    setCarsOpts(prev => {
      if (prev.length >= MAX_CARS) return prev;
      const newOpts = [...prev];
      newOpts.push(new Set());
      return newOpts;
    });
    setResetSignals(prev => {
      if (prev.length >= MAX_CARS) return prev;
      const newSignals = [...prev];
      newSignals.push(0);
      return newSignals;
    });
  }, [carsData.length]);

  // 차량 제거 함수
  const handleRemoveCar = (index: number) => {
    if (carsData.length <= 2) {
      alert("최소 2대의 차량은 선택해야 합니다.");
      return;
    }
    setCarsData(prev => prev.filter((_, i) => i !== index));
    setCarsOpts(prev => prev.filter((_, i) => i !== index));
    setResetSignals(prev => prev.filter((_, i) => i !== index));
  };

  // 차량 선택 핸들러 (인덱스 기반)
  const handleSelectCar = (index: number) => async (trimId: string, modelName?: string, baseTrimId?: string) => {
    const data = await fetchCarDetail(trimId, modelName, baseTrimId);
    if (data) {
      setCarsData(prev => {
        const newCars = [...prev];
        newCars[index] = data;
        return newCars;
      });
      setCarsOpts(prev => {
        const newOpts = [...prev];
        newOpts[index] = new Set();
        return newOpts;
      });
    }
  };

  // 차량 리셋 핸들러
  const handleResetCar = (index: number) => {
    setCarsData(prev => {
      const newCars = [...prev];
      newCars[index] = null;
      return newCars;
    });
    setCarsOpts(prev => {
      const newOpts = [...prev];
      newOpts[index] = new Set();
      return newOpts;
    });
    setResetSignals(prev => {
      const newSignals = [...prev];
      newSignals[index] = newSignals[index] + 1;
      return newSignals;
    });
  };

  const handleResetAll = () => {
    setCarsData([null, null]);
    setCarsOpts([new Set(), new Set()]);
    setResetSignals([0, 0]);
  };

  // 옵션 토글 핸들러 (인덱스 기반)
  const toggleCarOpt = (index: number) => (id: string) => {
    setCarsOpts(prev => {
      const newOpts = [...prev];
      const newSet = new Set(newOpts[index]);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      newOpts[index] = newSet;
      return newOpts;
    });
  };

  const handleViewResult = () => {
    const selectedCars = carsData.filter(car => car !== null);
    if (selectedCars.length < 2) {
      alert("최소 2대의 차량을 선택해야 비교가 가능합니다.");
      return;
    }

    const ids = selectedCars.map(car => car!._id || car!.id).filter(id => id);
    if (ids.length !== selectedCars.length) {
      alert("차량 ID를 식별할 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const opts = carsOpts.slice(0, selectedCars.length).map(opts => Array.from(opts).join(","));
    const queryParams = new URLSearchParams({ ids: ids.join(",") });
    opts.forEach((opt, idx) => {
      queryParams.append(`opts${idx + 1}`, opt);
    });
    router.push(`/quote/compare/vs?${queryParams.toString()}`);
  };

  return (
    <main style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 5% 80px" }}>
        
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: 0 }}>비교견적</h1>
                <p style={{ fontSize: "15px", color: "#64748b", marginTop: "4px" }}>최대 {MAX_CARS}대까지 차량을 비교해보세요.</p>
            </div>
            <button onClick={handleResetAll} style={btnResetStyle}>전체 초기화</button>
        </div>

        {/* 상단: 차량 선택 박스들 가로 배치 (가로 스크롤 가능) */}
        <div style={{ 
          overflowX: "auto",
          overflowY: "visible",
          marginBottom: "40px",
          paddingTop: "20px",
          paddingBottom: "20px",
          paddingLeft: "10px",
          paddingRight: "10px",
          WebkitOverflowScrolling: "touch",
        }}>
          <div style={{ 
            display: "flex", 
            gap: "20px",
            minWidth: "max-content",
          }}>
            {carsData.map((car, index) => (
              <div key={index} style={{ position: "relative", flexShrink: 0, width: "550px" }}>
                <CarSelector 
                  title={`차량 ${index + 1} 선택`} 
                  onSelectComplete={handleSelectCar(index)} 
                  onReset={() => handleResetCar(index)} 
                  resetSignal={resetSignals[index]} 
                />
                {carsData.length > 2 && (
                  <button
                    onClick={() => handleRemoveCar(index)}
                    style={{
                      position: "absolute",
                      top: "-16px",
                      right: "-16px",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      border: "3px solid #fff",
                      cursor: "pointer",
                      fontSize: "26px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
                      zIndex: 10,
                      lineHeight: "1",
                      padding: 0,
                      margin: 0,
                    }}
                    title="차량 제거"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* 추가 버튼 (최대 5개까지) */}
            {carsData.length < MAX_CARS && (
              <div
                onClick={handleAddCar}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "2px dashed #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minHeight: "400px",
                  flexShrink: 0,
                  width: "550px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "bold",
                    marginBottom: "16px",
                  }}
                >
                  +
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#475569", textAlign: "center" }}>
                  차량 추가
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px", textAlign: "center" }}>
                  최대 {MAX_CARS}대까지
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단: 결과 박스들 가로 배치 */}
        {carsData.some(car => car !== null) && (
            <div style={{ animation: "fadeIn 0.4s ease-out", borderTop: "2px dashed #e2e8f0", paddingTop: "40px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#333", marginBottom: "20px", textAlign: "center" }}>
                    선택된 차량 정보 및 옵션
                </h2>

                <div style={{ 
                  overflowX: "auto",
                  overflowY: "visible",
                  paddingTop: "20px",
                  paddingBottom: "20px",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                  WebkitOverflowScrolling: "touch",
                }}>
                  <div style={{ 
                    display: "flex", 
                    gap: "20px",
                    minWidth: "max-content",
                    alignItems: "stretch"
                  }}>
                    {carsData.map((car, index) => (
                      <div key={index} style={{ flexShrink: 0, width: "550px" }}>
                        {car ? (
                          <CarOptionSelectCard 
                            data={car} 
                            selectedSet={carsOpts[index]} 
                            onToggle={toggleCarOpt(index)} 
                          />
                        ) : (
                          <div className="empty-car-card">
                            차량 {index + 1}을 선택해주세요
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {carsData.filter(car => car !== null).length >= 2 && (
                    <div style={{ marginTop: "40px", textAlign: "center" }}>
                        <button onClick={handleViewResult} style={btnResultStyle}>
                            상세 비교 결과 보기 →
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .car-selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        @media (max-width: 768px) {
          .car-selector-grid {
            grid-template-columns: 1fr;
          }
        }
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 1024px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .car-result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 768px) {
          .car-result-grid {
            grid-template-columns: 1fr;
          }
        }
        .empty-car-card {
          border: 2px dashed #eee;
          border-radius: 16px;
          min-height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
          background-color: #fff;
        }
      `}</style>
    </main>
  );
}

// ---------------- [4] [핵심] Suspense Wrapper가 적용된 메인 페이지 ----------------
export default function CompareQuotePage() {
  return (
    // ✨ useSearchParams가 있는 CompareQuoteContent를 Suspense로 감쌈
    <Suspense fallback={<div style={{ padding: "100px", textAlign: "center" }}>로딩 중...</div>}>
      <CompareQuoteContent />
    </Suspense>
  );
}

// 스타일
const selectStyle: React.CSSProperties = { width: "100%", height: "180px", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "10px 12px", fontSize: "14px", outline: "none", color: "#333", minWidth: "120px" };
const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "6px" };
const btnResetStyle: React.CSSProperties = { padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "0.2s" };
const btnSearchStyle: React.CSSProperties = { padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "0.2s" };
const btnResultStyle: React.CSSProperties = { padding: "18px 50px", borderRadius: "99px", border: "none", backgroundColor: "#0f172a", color: "#fff", fontSize: "18px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)", transition: "transform 0.2s" };
