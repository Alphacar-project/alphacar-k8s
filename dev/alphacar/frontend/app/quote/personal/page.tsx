"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

// 백엔드 API 주소
const API_BASE = "/api";

// 타입 정의
interface ApiError {
  message?: string;
  status?: number;
}

interface Maker {
  _id?: string;
  name?: string;
  [key: string]: any;
}

interface Model {
  _id?: string;
  model_name?: string;
  name?: string;
  [key: string]: any;
}

interface BaseTrim {
  _id?: string;
  id?: string;
  name?: string;
  base_trim_name?: string;
  [key: string]: any;
}

interface Trim {
  _id?: string;
  trim_name?: string;
  name?: string;
  [key: string]: any;
}

interface VehicleData {
  _id?: string;
  id?: string;
  name?: string;
  trim_name?: string;
  vehicle_name?: string;
  model_name?: string;
  brand_name?: string;
  manufacturer?: string;
  base_price?: number;
  image_url?: string;
  main_image?: string;
  [key: string]: any;
}

interface CarSelectorProps {
  onSelectComplete: (trimId: string, modelName?: string, baseTrimId?: string) => void;
  onReset?: () => void;
  initialData?: {
    makerId?: string;
    modelId?: string;
    baseTrimId?: string;
    trimId?: string;
    modelName?: string;
  };
}

interface CarInfoCardProps {
  data: VehicleData | null;
}

// [유틸] 견고한 HTTP 응답 처리
const handleApiResponse = async (res: Response): Promise<any> => {
  if (!res.ok) {
    let errorData: ApiError = {};
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
function CarSelector({ onSelectComplete, onReset, initialData }: CarSelectorProps) {
  const [makerId, setMakerId] = useState<string>(initialData?.makerId || "");
  const [modelId, setModelId] = useState<string>(initialData?.modelId || "");
  const [baseTrimId, setBaseTrimId] = useState<string>(initialData?.baseTrimId || "");
  const [trimId, setTrimId] = useState<string>(initialData?.trimId || "");

  const [makers, setMakers] = useState<Maker[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [baseTrims, setBaseTrims] = useState<BaseTrim[]>([]);
  const [trims, setTrims] = useState<Trim[]>([]);

  const [trimName, setTrimName] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  const initialDataProcessedRef = useRef<string>("");

  // 1. 초기 로딩
  useEffect(() => {
    fetch(`${API_BASE}/vehicles/makers`)
      .then(handleApiResponse)
      .then((data: any) => { if (Array.isArray(data)) setMakers(data); })
      .catch((err: any) => { console.error("제조사 로딩 실패:", err); setMakers([]); });
  }, []);

  // 2. initialData가 있으면 자동으로 선택 (한 번만 실행)
  useEffect(() => {
    if (!initialData || isInitializing || makers.length === 0 || hasUserInteracted) return;
    
    const { makerId: initMakerId, modelId: initModelId, baseTrimId: initBaseTrimId, trimId: initTrimId, modelName: initModelName } = initialData;
    const initialDataKey = `${initMakerId}-${initModelId}-${initBaseTrimId}-${initTrimId}`;
    
    // 이미 처리한 initialData면 무시
    if (initialDataProcessedRef.current === initialDataKey) return;
    
    if (initMakerId && initModelId) {
      setIsInitializing(true);
      initialDataProcessedRef.current = initialDataKey;
      
      // 제조사 선택
      setMakerId(initMakerId);
      
      // 차종 목록 로드
      fetch(`${API_BASE}/vehicles/models?makerId=${encodeURIComponent(initMakerId)}`)
        .then(handleApiResponse)
        .then((data: any) => {
          if (Array.isArray(data)) {
            const uniqueModels = Array.from(new Map(data.map((m: Model) => [m.model_name, m])).values());
            setModels(uniqueModels);
            
            // 차종 선택
            const foundModel = uniqueModels.find((m: Model) => m._id === initModelId || m.model_name === initModelName);
            if (foundModel) {
              setModelId(foundModel._id || "");
              
              // 기본 트림 목록 로드
              fetch(`${API_BASE}/vehicles/base-trims?modelId=${encodeURIComponent(foundModel._id || "")}`)
                .then(handleApiResponse)
                .then((baseTrimData: any) => {
                  if (Array.isArray(baseTrimData)) {
                    setBaseTrims(baseTrimData);
                    
                    // 기본 트림 선택
                    if (initBaseTrimId) {
                      const foundBaseTrim = baseTrimData.find((bt: BaseTrim) => bt._id === initBaseTrimId || bt.id === initBaseTrimId);
                      if (foundBaseTrim) {
                        setBaseTrimId(foundBaseTrim._id || foundBaseTrim.id || "");
                      }
                    }
                    
                    // 세부 트림 목록 로드
                    fetch(`${API_BASE}/vehicles/trims?modelId=${encodeURIComponent(foundModel._id || "")}`)
                      .then(handleApiResponse)
                      .then((trimData: any) => {
                        if (Array.isArray(trimData)) {
                          setTrims(trimData);
                          
                          // 세부 트림 선택
                          if (initTrimId) {
                            const foundTrim = trimData.find((t: Trim) => 
                              t._id === initTrimId || 
                              t.trim_name === initTrimId || 
                              t.trim_name?.includes(initTrimId) ||
                              t.name === initTrimId
                            );
                            if (foundTrim) {
                              const trimVal = foundTrim._id || foundTrim.trim_name || foundTrim.name || "";
                              setTrimId(trimVal);
                              setTrimName(foundTrim.name || foundTrim.trim_name || "");
                            }
                          }
                        }
                        setIsInitializing(false);
                      })
                      .catch((err: any) => {
                        console.error("세부 트림 로딩 실패:", err);
                        setIsInitializing(false);
                      });
                  } else {
                    setIsInitializing(false);
                  }
                })
                .catch((err: any) => {
                  console.error("기본 트림 로딩 실패:", err);
                  setIsInitializing(false);
                });
            } else {
              setIsInitializing(false);
            }
          } else {
            setIsInitializing(false);
          }
        })
        .catch((err: any) => {
          console.error("모델 로딩 실패:", err);
          setIsInitializing(false);
        });
    }
  }, [initialData, makers, isInitializing, hasUserInteracted]);

  const handleReset = () => {
    setMakerId(""); setModelId(""); setBaseTrimId(""); setTrimId("");
    setTrimName("");
    setModels([]); setBaseTrims([]); setTrims([]);
    setHasUserInteracted(false);
    initialDataProcessedRef.current = "";
    if (onReset) onReset();
  };

  const handleMakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMakerId = e.target.value;
    setHasUserInteracted(true);
    setMakerId(newMakerId);
    setModelId(""); setBaseTrimId(""); setTrimId(""); setTrimName("");
    setModels([]); setBaseTrims([]); setTrims([]);

    if (!newMakerId) return;

    fetch(`${API_BASE}/vehicles/models?makerId=${encodeURIComponent(newMakerId)}`)
      .then(handleApiResponse)
      .then((data: any) => {
        if (Array.isArray(data)) {
          const uniqueModels = Array.from(new Map(data.map((m: Model) => [m.vehicle_name || m.model_name, m])).values());
          setModels(uniqueModels);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else setModels([]);
      })
      .catch((err: any) => console.error("모델 로딩 실패:", err));
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    setHasUserInteracted(true);
    
    if (!newModelId) {
      setModelId("");
      setBaseTrimId(""); setTrimId(""); setTrimName("");
      setBaseTrims([]); setTrims([]);
      return;
    }

    setModelId(newModelId);
    setBaseTrimId(""); setTrimId(""); setTrimName("");
    setBaseTrims([]); setTrims([]);

    fetch(`${API_BASE}/vehicles/base-trims?modelId=${encodeURIComponent(newModelId)}`)
      .then(handleApiResponse)
      .then((data: any) => {
        if (Array.isArray(data)) {
          setBaseTrims(data);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else setBaseTrims([]);
      })
      .catch((err: any) => console.error("기본 트림 로딩 실패:", err));
  };

  const handleBaseTrimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBaseTrimId = e.target.value; // base_trim_name
    setHasUserInteracted(true);
    
    if (!newBaseTrimId || !modelId) {
      setBaseTrimId("");
      setTrimId(""); setTrimName("");
      setTrims([]);
      return;
    }

    setBaseTrimId(newBaseTrimId);
    setTrimId(""); setTrimName("");
    setTrims([]);

    // 기본 트림 선택 후 세부 트림 목록 가져오기
    // base_trim_name을 전달 (백엔드에서 base_trim_name으로 검색)
    fetch(`${API_BASE}/vehicles/trims?modelId=${encodeURIComponent(newBaseTrimId)}`)
      .then(handleApiResponse)
      .then((data: any) => {
        if (Array.isArray(data)) {
          setTrims(data);
          // 자동 선택 로직 제거 - 사용자가 직접 선택하도록 함
        } else setTrims([]);
      })
      .catch((err: any) => console.error("세부 트림 로딩 실패:", err));
  };

  const handleTrimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrimId = e.target.value;
    setHasUserInteracted(true);
    
    if (!newTrimId) {
      setTrimId("");
      setTrimName("");
      return;
    }
    
    const index = e.target.selectedIndex;
    const selectedText = index >= 0 ? e.target.options[index].text : "";
    
    // 상태를 즉시 업데이트
    setTrimId(newTrimId);
    setTrimName(selectedText);

    // 상태 업데이트 후 onSelectComplete 호출
    if (onSelectComplete) {
      // trimId는 _id 또는 trim_name일 수 있음
      // _id를 우선 사용하여 고유성 보장
      const selectedModel = models.find((m: Model) => m._id === modelId);
      const modelName = selectedModel?.model_name || selectedModel?.name || "";
      onSelectComplete(newTrimId, modelName, baseTrimId); // _id 또는 trim_name을 전달, baseTrimId도 함께 전달
    }
  };

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#1e293b", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>차량 선택</span>
        <button onClick={handleReset} style={btnResetStyle}>초기화</button>
        
      </div>

      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>제조사 → 차종 → 기본트림 → 세부트림 순서로 선택</div>

      <div className="personal-filter-grid">

        {/* 제조사 */}
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>제조사</div>
          <select key={`maker-${makerId}`} size={10} value={makerId || ""} onChange={handleMakerChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>- 선택 -</option>
            {makers.length === 0 && <option disabled>로딩중...</option>}
            {makers.map((m, idx) => (
              <option key={m._id || `m-${idx}`} value={m._id || m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* 차종 */}
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>차종</div>
          <select key={`model-${modelId}`} size={10} value={modelId || ""} onChange={handleModelChange} style={selectStyle}>
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

        {/* 기본트림 */}
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>기본트림</div>
          <select key={`baseTrim-${baseTrimId}`} size={10} value={baseTrimId || ""} onChange={handleBaseTrimChange} style={selectStyle}>
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

        {/* 세부트림 */}
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle}>세부트림</div>
          <select key={`trim-${trimId}`} size={10} value={trimId || ""} onChange={handleTrimChange} style={selectStyle}>
            <option value="" disabled style={{ color: "#ccc" }}>{baseTrimId ? "- 선택 -" : "-"}</option>
             {trims.length === 0 ? (
               <option value="" disabled style={{ color: "#ccc" }}>{baseTrimId ? "없음" : "-"}</option>
            ) : (
               trims.map((t, idx) => {
                 const uniqueKey = t._id || `trim-${idx}`;
                 // _id를 우선 사용 (고유성 보장), 없으면 trim_name 사용
                 const val = t._id || t.trim_name || t.name || t.lineup_id || "";
                 return <option key={uniqueKey} value={val}>{t.name || t.trim_name}</option>;
               })
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

// ---------------- [2] 차량 정보 카드 ----------------
function CarInfoCard({ data }: CarInfoCardProps) {
  if (!data) return null;
  // ✅ [수정 반영] data.base_price 사용
  const basePrice = data.base_price || 0; 

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            {/* 이미지 */}
            <div style={{ width: "100%", maxWidth: "500px", height: "260px", borderRadius: "12px", backgroundColor: data.image_url ? "transparent" : "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {/* ✅ [수정 반영] main_image 필드도 확인 */}
                {data.image_url || data.main_image ? (
                    <img src={data.image_url || data.main_image} alt={data.name || "차량 이미지"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                    <span style={{ color: "#aaa", fontSize: "14px" }}>이미지 준비중</span>
                )}
            </div>

            {/* 텍스트 정보 */}
            <div style={{ textAlign: "center", width: "100%" }}>
                {/* ✅ [수정 반영] 제조사/브랜드명, 모델명/차량명 체크 */}
                <div style={{ fontSize: "16px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>
                    {data.brand_name || data.manufacturer} {data.vehicle_name || data.model_name}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#1e293b", marginBottom: "24px", lineHeight: "1.3" }}>
                    {data.name || data.trim_name} {/* 트림 이름 */}
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", backgroundColor: "#f1f5f9", padding: "16px 32px", borderRadius: "99px" }}>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: 600 }}>기본 차량가</span>
                    <span style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb" }}>{basePrice.toLocaleString()}원</span>
                </div>
            </div>
        </div>
    </div>
  );
}

// ---------------- [3] 메인 페이지 ----------------
function PersonalQuotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [carData, setCarData] = useState<VehicleData | null>(null);
  const [isAutoSelecting, setIsAutoSelecting] = useState<boolean>(false);
  const [selectorInitialData, setSelectorInitialData] = useState<{
    makerId?: string;
    modelId?: string;
    baseTrimId?: string;
    trimId?: string;
    modelName?: string;
  } | undefined>(undefined);

  // ✅ [핵심 수정] 트림 추출 및 병합 로직을 포함한 fetch 함수
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
          let errorMsg = `조회 실패`;
          try { const errJson = await res.json(); if (errJson.message) errorMsg = errJson.message; } catch(e) {}
          throw new Error(errorMsg);
      }
      const rawVehicleData: any = await res.json(); // 전체 Vehicle 데이터

      // --- 트림 데이터 추출 및 병합 로직 ---
      let selectedTrim: any = null;
      const trims = rawVehicleData.trims || [];

      if (trims.length > 0) {
          const decodedTrimId = decodeURIComponent(trimId);
          // "Reserve A/T:1" 형식에서 실제 트림 이름만 추출 (":숫자" 제거)
          const trimNameOnly = decodedTrimId.split(':')[0].trim();
          
          // 1. _id로 먼저 찾기 (가장 정확한 매칭, 고유성 보장)
          selectedTrim = trims.find((t: any) => t._id === trimId || t._id === decodedTrimId);

          // 2. trim_id로 찾기
          if (!selectedTrim) {
              selectedTrim = trims.find((t: any) => t.trim_id === trimId || t.trim_id === decodedTrimId);
          }

          // 3. 이름으로 정확히 일치하는 트림 찾기 (String ID 대응)
          if (!selectedTrim) {
              selectedTrim = trims.find((t: any) => t.trim_name === trimNameOnly || t.trim_name === decodedTrimId);
          }

          // 4. Fallback: 여전히 못 찾았다면 첫 번째 트림 사용
          if (!selectedTrim) {
              selectedTrim = trims[0]; 
          }
      }
      
      if (!selectedTrim) {
          console.warn("트림 데이터가 없어 기본 차량 정보만 표시됩니다.");
          return rawVehicleData; // 트림이 없어도 기본적인 Vehicle 정보만 반환
      }

      // 4. Vehicle + Trim 데이터 병합 (UI가 사용할 최종 데이터 구성)
      const mergedData: VehicleData = {
          ...rawVehicleData, // 상위 정보 유지
          name: selectedTrim.trim_name, // ✅ 트림명 덮어쓰기
          base_price: selectedTrim.price, // ✅ 트림 가격 덮어쓰기
          // options: selectedTrim.options, // 옵션은 result 페이지에서 다시 가져오므로 여기서는 생략
      };
      
      return mergedData;

    } catch (err: any) {
      console.error(err);
      alert(`차량 정보를 불러오는데 실패했습니다.\n(${err.message})`);
      return null;
    }
  };

  const handleSelectComplete = async (trimId: string, modelName?: string, baseTrimId?: string) => {
    const data = await fetchCarDetail(trimId, modelName, baseTrimId);
    if (data) {
      setCarData(data);
      
      // 차량 정보를 기반으로 제조사, 차종, 기본트림 ID 찾기
      if (data.brand_name || data.manufacturer) {
        try {
          // 1. 제조사 목록에서 브랜드명으로 찾기
          const makersRes = await fetch(`${API_BASE}/vehicles/makers`);
          const makersData = await makersRes.json();
          const foundMaker = Array.isArray(makersData) 
            ? makersData.find((m: Maker) => 
                m.name === data.brand_name || 
                m.name === data.manufacturer ||
                m.name?.includes(data.brand_name || data.manufacturer || "")
              )
            : null;
          
          if (foundMaker) {
            // 2. 차종 목록에서 모델명으로 찾기
            const modelNameToSearch = data.vehicle_name || data.model_name || modelName || "";
            const modelsRes = await fetch(`${API_BASE}/vehicles/models?makerId=${encodeURIComponent(foundMaker._id || "")}`);
            const modelsData = await modelsRes.json();
            const foundModel = Array.isArray(modelsData)
              ? modelsData.find((m: Model) => 
                  m.model_name === modelNameToSearch ||
                  m.name === modelNameToSearch ||
                  m.model_name?.includes(modelNameToSearch) ||
                  m.name?.includes(modelNameToSearch)
                )
              : null;
            
            if (foundModel) {
              // 3. 기본트림 목록에서 찾기
              const baseTrimsRes = await fetch(`${API_BASE}/vehicles/base-trims?modelId=${encodeURIComponent(foundModel._id || "")}`);
              const baseTrimsData = await baseTrimsRes.json();
              const foundBaseTrim = Array.isArray(baseTrimsData) && data.base_trim_name
                ? baseTrimsData.find((bt: BaseTrim) => 
                    bt.base_trim_name === data.base_trim_name ||
                    bt.name === data.base_trim_name
                  )
                : null;
              
              // 4. 세부트림 목록에서 찾기
              const trimsRes = await fetch(`${API_BASE}/vehicles/trims?modelId=${encodeURIComponent(foundModel._id || "")}`);
              const trimsData = await trimsRes.json();
              const foundTrim = Array.isArray(trimsData)
                ? trimsData.find((t: Trim) => 
                    t.trim_name === trimId ||
                    t.trim_name?.includes(trimId) ||
                    t.name === trimId
                  )
                : null;
              
              setSelectorInitialData({
                makerId: foundMaker._id || "",
                modelId: foundModel._id || "",
                baseTrimId: foundBaseTrim?._id || foundBaseTrim?.id || "",
                trimId: foundTrim?._id || foundTrim?.trim_name || trimId,
                modelName: foundModel.model_name || foundModel.name || modelNameToSearch,
              });
            }
          }
        } catch (err) {
          console.error("선택기 초기 데이터 설정 실패:", err);
        }
      }
    }
  };

  // modelName과 brandName으로 제조사와 차종을 찾는 함수
  const findMakerAndModelByName = async (modelName: string, brandName?: string) => {
    try {
      // 1. 모든 제조사 목록 가져오기
      const makersRes = await fetch(`${API_BASE}/vehicles/makers`);
      const makersData = await makersRes.json();
      if (!Array.isArray(makersData)) return null;

      // 2. 브랜드명이 있으면 해당 제조사만 확인, 없으면 모든 제조사 확인
      const makersToCheck = brandName
        ? makersData.filter((m: Maker) => 
            m.name === brandName || 
            m.name?.includes(brandName)
          )
        : makersData;

      // 3. 각 제조사별로 모델 목록 확인
      for (const maker of makersToCheck) {
        const modelsRes = await fetch(`${API_BASE}/vehicles/models?makerId=${encodeURIComponent(maker._id || "")}`);
        const modelsData = await modelsRes.json();
        
        if (Array.isArray(modelsData)) {
          const foundModel = modelsData.find((m: Model) => 
            m.model_name === modelName ||
            m.name === modelName ||
            m.model_name?.includes(modelName) ||
            m.name?.includes(modelName)
          );
          
          if (foundModel) {
            return {
              makerId: maker._id || "",
              modelId: foundModel._id || "",
              modelName: foundModel.model_name || foundModel.name || modelName,
            };
          }
        }
      }
      return null;
    } catch (err) {
      console.error("제조사/차종 찾기 실패:", err);
      return null;
    }
  };

  // URL 파라미터에서 trimId와 modelName 읽어서 자동 선택
  useEffect(() => {
    const trimId = searchParams.get("trimId");
    const modelName = searchParams.get("modelName");
    const brandName = searchParams.get("brandName");
    
    if (!isAutoSelecting && !carData) {
      setIsAutoSelecting(true);
      
      if (trimId) {
        // trimId가 있으면 기존 로직 사용
        handleSelectComplete(trimId, modelName || undefined).finally(() => {
          setIsAutoSelecting(false);
        });
      } else if (modelName) {
        // modelName만 있으면 제조사와 차종만 자동 선택
        findMakerAndModelByName(modelName, brandName || undefined).then((result) => {
          if (result) {
            setSelectorInitialData({
              makerId: result.makerId,
              modelId: result.modelId,
              modelName: result.modelName,
            });
          }
          setIsAutoSelecting(false);
        });
      } else {
        setIsAutoSelecting(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleReset = () => {
    setCarData(null);
    setSelectorInitialData(undefined);
  };

  const handleMoveToResult = () => {
    if (!carData) {
        alert("차량을 먼저 선택해주세요.");
        return;
    }
    // 이 페이지에서 선택한 트림 ID/이름을 result 페이지로 전달
    const safeId = carData.name || carData._id || carData.id || ""; 

    if (!safeId) {
        alert("차량 식별 정보를 찾을 수 없습니다. 다시 선택해주세요.");
        return;
    }
    // result 페이지로 이동할 때 트림 ID와 차종 이름을 넘김
    const queryParams = new URLSearchParams({ trimId: safeId });
    if (carData.vehicle_name || carData.model_name) {
      queryParams.append('modelName', carData.vehicle_name || carData.model_name);
    }
    router.push(`/quote/personal/result?${queryParams.toString()}`);
  };

  return (
    <main style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 5% 80px" }}>

        <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", marginBottom: "12px" }}>나만의 견적 내기</h1>
            <p style={{ fontSize: "16px", color: "#64748b" }}>원하는 차량을 선택하고 상세 옵션을 구성해보세요.</p>
        </div>

        {/* ✅ [UI 수정] 상하(Vertical) 배치, 간격 축소 (gap: 16px) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* 1. 차량 선택기 */}
            <div style={{ width: "100%" }}>
                <CarSelector 
                  onSelectComplete={handleSelectComplete} 
                  onReset={handleReset}
                  initialData={selectorInitialData}
                />
            </div>

            {/* 2. 차량 정보 및 버튼 (선택 시 아래에 바로 붙음) */}
            {carData && (
                // 🚨 [수정] 화살표 제거됨, 간격 축소됨
                <div style={{ animation: "slideUp 0.5s ease-out", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <CarInfoCard data={carData} />

                    <button onClick={handleMoveToResult} style={btnResultStyle}>
                        상세 견적 확인하기 →
                    </button>
                </div>
               
            )}
        </div>

      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .personal-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .personal-filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .personal-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default function PersonalQuotePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "100px 0" }}>로딩 중...</div>}>
      <PersonalQuotePageContent />
    </Suspense>
  );
}

// 스타일
const selectStyle: React.CSSProperties = { width: "100%", height: "240px", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "12px", fontSize: "14px", outline: "none", color: "#333", backgroundColor: "#f8fafc" };
const labelStyle: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#475569", marginBottom: "8px", paddingLeft: "4px" };
const btnResetStyle: React.CSSProperties = { padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#64748b", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "0.2s" };
const btnResultStyle: React.CSSProperties = { width: "100%", maxWidth: "400px", margin: "0 auto", padding: "20px 0", borderRadius: "99px", border: "none", backgroundColor: "#0f172a", color: "#fff", fontSize: "18px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)", transition: "transform 0.2s" };

