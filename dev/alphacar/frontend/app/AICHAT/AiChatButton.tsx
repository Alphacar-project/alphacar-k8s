// app/AICHAT/AiChatButton.tsx
"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchMypageInfo } from "@/lib/api";
import MascotLoader from "./MascotLoader";

const DEFAULT_WIDTH = 430;
const DEFAULT_HEIGHT = 620;

interface Message {
  role: "user" | "ai" | "system";
  content: string;
  image?: string | null;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ContentSegment {
  type: "text" | "image" | "link-image";
  content?: string;
  alt?: string;
  src?: string;
  href?: string;
}

export default function AiChatButton() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isNarrow, setIsNarrow] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [isHoveringButton, setIsHoveringButton] = useState<boolean>(false);

  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const normalPosRef = useRef<Position>({ x: 0, y: 0 });
  const normalSizeRef = useRef<Size>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 외부에서 챗봇 열기 트리거
  useEffect(() => {
    const openHandler = () => {
      if (!open) {
        handleToggleOpen();
      }
    };
    window.addEventListener("openAiChat", openHandler);
    return () => window.removeEventListener("openAiChat", openHandler);
  }, [open]);

  // ─────────────────────────────
  //  공통 상수
  // ─────────────────────────────
  const HEADER_HEIGHT = 52;

  // 반응형
  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 1100);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // 드래그
  useEffect(() => {
    if (!open || !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - size.width - 8;
      const maxY = window.innerHeight - size.height - 8;

      setPosition({
        x: Math.max(8, Math.min(newX, maxX)),
        y: Math.max(8, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [open, isDragging, size.width, size.height]);

  // 스크롤 자동 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, previewUrl]);

  // 헤더 드래그 시작
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isNarrow) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // 창 크기 토글 (기본 ↔ 60%x80%)
  const handleToggleMaximize = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!isMaximized) {
      normalPosRef.current = { ...position };
      normalSizeRef.current = { ...size };

      const targetWidth = Math.min(
        window.innerWidth * 0.6,
        window.innerWidth - 16
      );
      const targetHeight = Math.min(
        window.innerHeight * 0.8,
        window.innerHeight - 16
      );

      const x = (window.innerWidth - targetWidth) / 2;
      const y = (window.innerHeight - targetHeight) / 2;

      setPosition({
        x: Math.max(8, x),
        y: Math.max(8, y),
      });
      setSize({
        width: targetWidth,
        height: targetHeight,
      });
      setIsMaximized(true);
    } else {
      setPosition({ ...normalPosRef.current });
      setSize({ ...normalSizeRef.current });
      setIsMaximized(false);
    }
  };

  // 초기화
  const performReset = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    clearImageSelection();
    setShowResetConfirm(false);
  };

  const handleResetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowResetConfirm(true);
  };

  // 이미지 관련
  const clearImageSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 메시지 전송
  const handleSendMessage = async (customMessage?: string) => {
    const msgToSend = customMessage || input;
    if ((!msgToSend.trim() && !selectedFile) || loading) return;

    // socialId 가져오기 (localStorage에서)
    const socialId = typeof window !== 'undefined' 
      ? localStorage.getItem('user_social_id')
      : null;

    if (!socialId) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "로그인이 필요합니다. 먼저 로그인해주세요." },
      ]);
      return;
    }

    const userMsg: Message = { role: "user", content: msgToSend, image: previewUrl || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let data: { response: string };
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const res = await fetch("/api/chat/image", {
          method: "POST",
          headers: {
            "x-social-id": socialId,
          },
          body: formData,
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("로그인이 필요합니다. 먼저 로그인해주세요.");
          }
          // 백엔드에서 에러 응답 시 JSON 파싱 시도
          try {
            const errorData = await res.json();
            if (errorData.response) {
              data = errorData;
            } else {
              throw new Error("Image upload failed");
            }
          } catch (e) {
            throw new Error("Image upload failed");
          }
        } else {
          data = await res.json();
        }
        clearImageSelection();
      } else {
        const res = await fetch("/api/chat/ask", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-social-id": socialId,
          },
          body: JSON.stringify({ message: userMsg.content }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("로그인이 필요합니다. 먼저 로그인해주세요.");
          }
          throw new Error("Network error");
        }
        data = await res.json();
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      // 이미지 업로드 실패 시 통일된 메시지 사용
      const errorMessage = selectedFile 
        ? "죄송합니다. 사진에서 자동차를 명확하게 식별하지 못했습니다. 차량이 더 잘 보이는 사진으로 다시 시도해 주세요."
        : "죄송합니다. 서버 연결에 실패했습니다.";
      setMessages((prev) => [
        ...prev,
        { role: "system", content: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // [수정됨] 내용 렌더러: 링크가 포함된 이미지 감지 및 클릭 기능 추가
  // ─────────────────────────────────────────────────────────────
  const renderContent = (text: string): ReactNode => {
    if (!text) return null;

    // 정규식: 
    // 그룹 1,2,3: [![alt](src)](href)  <- 링크가 있는 이미지
    // 그룹 4,5:   ![alt](src)          <- 링크 없는 일반 이미지
    const regex = /\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)|!\[(.*?)\]\((.*?)\)/g;
    
    const segments: ContentSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // 1. 매칭 전 텍스트 추가
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // 2. 이미지/링크 정보 추출
      if (match[3]) {
        // 링크가 있는 이미지
        segments.push({
          type: "link-image",
          alt: match[1],
          src: match[2],
          href: match[3],
        });
      } else {
        // 링크 없는 이미지
        segments.push({
          type: "image",
          alt: match[4],
          src: match[5],
        });
      }

      lastIndex = regex.lastIndex;
    }
    // 3. 남은 텍스트 추가
    if (lastIndex < text.length) {
      segments.push({ type: "text", content: text.substring(lastIndex) });
    }

    // 4. 렌더링
    return segments.map((part, idx) => {
      if (part.type === "text") {
        return <span key={idx}>{part.content}</span>;
      }

      if (part.type === "link-image") {
        return (
          <div
            key={idx}
            style={{ margin: "10px 0", borderRadius: 8, overflow: "hidden" }}
          >
            <a
              href={part.href}
              style={{
                display: "block",
                cursor: "pointer",
                position: "relative",
                textDecoration: "none",
              }}
            >
              <img
                src={part.src}
                alt={part.alt}
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
              {/* 클릭 유도 오버레이 */}
              <div
                style={{
                  padding: "8px",
                  backgroundColor: "#f0f8ff",
                  color: "#0F62FE",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                👆 눌러서 상세 견적 확인하기
              </div>
            </a>
          </div>
        );
      }

      // 일반 이미지
      return (
        <div
          key={idx}
          style={{ margin: "10px 0", borderRadius: 8, overflow: "hidden" }}
        >
          <img
            src={part.src}
            alt={part.alt}
            style={{ maxWidth: "100%", height: "auto", display: "block" }}
          />
        </div>
      );
    });
  };

  // 팝업 위치 스타일
  const popupWrapperStyle: React.CSSProperties = isNarrow
    ? {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.25)",
        zIndex: isMaximized ? 9999 : 70,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }
    : {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isMaximized ? 9999 : 70,
      };

  const innerPanelStyle: React.CSSProperties = isNarrow
    ? {
        width: "100%",
        maxWidth: DEFAULT_WIDTH,
        height: "90vh",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        borderRadius: 18,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }
    : {
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 18,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      };

  // 플로팅 버튼 열기/닫기
  const handleToggleOpen = async () => {
    // 로그인 체크 (챗봇을 열 때만)
    if (!open) {
      try {
        const data = await fetchMypageInfo();
        if (!data.isLoggedIn || !data.user) {
          alert("로그인이 필요한 서비스입니다.");
          router.push("/mypage/login");
          return;
        }

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const width = Math.min(DEFAULT_WIDTH, viewportW - 32);
        const height = Math.min(DEFAULT_HEIGHT, viewportH - 200);

        const x = viewportW - width - 96;
        const y = viewportH - height - 140;

        const safePos: Position = {
          x: Math.max(8, x),
          y: Math.max(8, y),
        };

        setSize({ width, height });
        setPosition(safePos);
        normalPosRef.current = safePos;
        normalSizeRef.current = { width, height };
        setIsMaximized(false);
      } catch (error) {
        console.error("로그인 정보 확인 실패:", error);
        alert("로그인 정보를 확인할 수 없습니다. 로그인 페이지로 이동합니다.");
        router.push("/mypage/login");
        return;
      }
    }

    setOpen((prev) => !prev);
    setIsPressed(false);
  };

  // 외부에서 챗봇 열기 트리거 (예: 고객센터 카드)
  useEffect(() => {
    const openHandler = () => {
      if (!open) {
        handleToggleOpen();
      }
    };
    window.addEventListener("openAiChat", openHandler);
    return () => window.removeEventListener("openAiChat", openHandler);
  }, [open, handleToggleOpen]);

  // ─────────────────────────────
  //  JSX
  // ─────────────────────────────
  return (
    <>
      {/* 오른쪽 아래 AI CHAT 버튼 */}
      <div
        onClick={handleToggleOpen}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseEnter={() => setIsHoveringButton(true)}
        onMouseLeave={() => {
          setIsHoveringButton(false);
          setIsPressed(false);
        }}
        style={{
          position: "fixed",
          right: isNarrow ? "96px" : "120px",
          bottom: "32px",
          zIndex: 60,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          transform: isPressed ? "scale(0.92)" : isHoveringButton ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.2s ease-out",
          background: "transparent",
        }}
        aria-label="ALPHACAR AI 챗봇 열기"
      >
        {!open && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* 말풍선 */}
            <div
              style={{
                position: "relative",
                backgroundColor: "#1a1a1a",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "18px",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                opacity: isHoveringButton ? 1 : 0.95,
                transform: isHoveringButton ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.2s ease-out",
              }}
            >
              ALPHACAR가 도와드립니다
              {/* 말풍선 꼬리 */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #1a1a1a",
                }}
              />
            </div>
            <img
              src="/aichat/alphacar-mascot.webp"
              alt="ALPHACAR AI 챗봇"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget;
                // 모든 이미지가 실패하면 빈 이미지로 처리하거나 기본 아이콘 표시
                target.style.display = "none";
              }}
              onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                // 이미지 로드 성공 시 스타일 유지
                e.currentTarget.style.display = "block";
              }}
              style={{
                width: 130,
                height: 130,
                objectFit: "contain",
                pointerEvents: "none",
                display: "block",
                backgroundColor: "transparent",
              }}
              loading="eager"
            />
          </div>
        )}

        {open && (
          <div
            style={{
              backgroundColor: "#0F62FE",
              color: "#ffffff",
              boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
              minWidth: 120,
              height: 44,
              borderRadius: "999px",
              padding: "0 18px",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            챗봇 상담
          </div>
        )}
      </div>

      {/* 챗봇 팝업 */}
      {open && (
        <div style={popupWrapperStyle}>
          <div style={innerPanelStyle}>
            {/* 헤더 */}
            <div
              style={{
                height: HEADER_HEIGHT,
                backgroundColor: "#222",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px 0 16px",
                cursor: isNarrow ? "default" : "move",
              }}
              onMouseDown={handleHeaderMouseDown}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                알파카 챗봇
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 14,
                }}
              >
                <button
                  type="button"
                  onClick={handleToggleMaximize}
                  title={isMaximized ? "기본 크기" : "확대"}
                  style={headerIconButtonStyle}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="6"
                      width="14"
                      height="12"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="#0F62FE"
                      strokeWidth="1.8"
                    />
                    <rect
                      x="8"
                      y="9"
                      width="8"
                      height="6"
                      rx="1.2"
                      ry="1.2"
                      fill="none"
                      stroke="#0F62FE"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleResetClick}
                  title="대화 초기화"
                  style={headerIconButtonStyle}
                >
                  ↺
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  title="닫기"
                  style={headerIconButtonStyle}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 🔄 로딩 오버레이 : 투명 배경 + 가운데 영상 + 아래 텍스트 */}
            {loading && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: HEADER_HEIGHT,
                  bottom: 60,
                  backgroundColor: "transparent",
                  zIndex: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    pointerEvents: "none",
                  }}
                >
                  {/* ✅ 영상만 위로 살짝 올리기 */}
                  <div
                    style={{
                      width: 260,
                      height: 700,
                      transform: "translateY(-40px)",
                    }}
                  >
                    <MascotLoader />
                  </div>

                  {/* 텍스트는 그대로 위치, 박스로만 감싸기 */}
                  <div
                    style={{
                      marginTop: 4,
                      padding: "6px 12px",
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#222",
                        whiteSpace: "nowrap",
                      }}
                    >
                      잠시만 기다려주세요... AI가 최적의 정보를 찾는 중입니다.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 초기화 확인 팝업 */}
            {showResetConfirm && (
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: HEADER_HEIGHT + 20,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  padding: "10px 14px",
                  fontSize: 12,
                  zIndex: 90,
                  width: 230,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  대화 내용을 모두 지우고
                  <br />
                  처음부터 다시 시작하시겠습니까?
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    style={{
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={performReset}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      backgroundColor: "#0F62FE",
                      color: "#fff",
                      padding: "4px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* 중앙 내용 (배너 + 안내 + FAQ + 대화) */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                minHeight: 0,
                padding: "14px 16px 10px",
                backgroundColor: "#f5f5f7",
                overflowY: "auto",
                fontSize: 13,
                color: "#333",
              }}
            >
              {/* 배너 */}
              <div
                style={{
                  width: "100%",
                  borderRadius: 18,
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <img
                  src="/aichat/chat-banner.png"
                  alt="ALPHACAR 배너"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* 인사말 */}
              <div
                style={{
                  backgroundColor: "#f2f2f4",
                  borderRadius: 18,
                  padding: "20px 22px",
                  marginBottom: 16,
                  lineHeight: 1.65,
                  fontSize: "15px",
                  color: "#333333",
                  letterSpacing: "-0.02em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <p style={{ margin: 0, marginBottom: 6, fontWeight: "700", fontSize: "18px", color: "#111" }}>안녕하세요.</p>
                <p style={{ margin: 0, marginBottom: 14, fontWeight: "600", color: "#0F62FE" }}>
                  AI 챗봇 알파카 인사 드립니다. 
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                  아래 버튼 중 선택하시거나,
                  <br />
                  차량 사진을 올리시거나 궁금한 점을 물어보세요! (사진 10MB 제한)
                </p>
              </div>

              {/* FAQ 버튼 영역 */}
              <div style={{ marginBottom: 16 }}>
                {/* 섹션 제목 추가 */}
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#333",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>💡</span> 이런 질문은
                  어떠세요?
                </p>

                {/* 버튼 리스트 (태그 스타일) */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {[
                    "3천만 원대 사회초년생 첫 차 추천해줘",
                    "쏘나타랑 그랜저 가격이랑 옵션 비교해줘",
                    "4인 가족이 탈 만한 차박용 SUV 추천해줘",
                    "연비 좋은 하이브리드 차량 뭐 있어?",
                    "제네시스 G80 사진이랑 견적 보여줘",
                  ].map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(text)}
                      onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor = "#E5F1FF";
                        e.currentTarget.style.color = "#0F62FE";
                        e.currentTarget.style.borderColor = "#0F62FE";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.color = "#444";
                        e.currentTarget.style.borderColor = "#e0e0e0";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "20px",
                        border: "1px solid #e0e0e0",
                        backgroundColor: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#444",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        textAlign: "left",
                        lineHeight: 1.4,
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* 경고 문구 (박스 형태로 깔끔하게 정리) */}
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    backgroundColor: "#fff0f0",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#d93025",
                    lineHeight: "1.4",
                    display: "flex",
                    gap: "6px",
                    alignItems: "start",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <span>
                    금융, 정치, 날씨 등 <b>자동차와 무관한 질문</b>은 답변하지
                    않습니다.
                  </span>
                </div>
              </div>
              {/* 대화 영역 */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isBot = msg.role === "ai" || msg.role === "system";

                if (isUser) {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          padding: "9px 13px",
                          borderRadius: 12,
                          backgroundColor: "#0F62FE",
                          color: "#ffffff",
                          border: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.image && (
                          <div
                            style={{
                              marginBottom: 8,
                              borderRadius: 8,
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={msg.image}
                              alt="Upload"
                              style={{
                                maxWidth: "100%",
                                maxHeight: 200,
                                display: "block",
                              }}
                            />
                          </div>
                        )}
                        {msg.content && renderContent(msg.content)}
                      </div>
                    </div>
                  );
                }

                if (isBot) {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginBottom: 8,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "999px",
                          backgroundColor: "#0F62FE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src="/aichat/alphacar-mascot.webp"
                          alt="알파카"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.currentTarget;
                            if (target.src.includes("alphacar-mascot.webp")) {
                              target.src = "/aichat/alphacar-mascot.png";
                            } else {
                              target.style.display = "none";
                            }
                          }}
                          style={{
                            width: "85%",
                            height: "85%",
                            objectFit: "contain",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "9px 13px",
                          borderRadius: 12,
                          backgroundColor: "#ffffff",
                          color: "#000000",
                          border: "1px solid #eeeeee",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content && renderContent(msg.content)}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* 하단 입력 */}
            <div
              style={{
                borderTop: "1px solid #eee",
                backgroundColor: "#ffffff",
                padding: "10px 10px 10px",
              }}
            >
              {previewUrl && (
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #f0f0f0",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #ddd",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "#555",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedFile?.name}
                  </div>
                  <button
                    type="button"
                    onClick={clearImageSelection}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#999",
                      fontSize: 16,
                    }}
                  >
                    ❌
                  </button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title="사진 업로드"
                  style={{
                    border: "none",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "999px",
                    width: 38,
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 18,
                  }}
                >
                  📷
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedFile
                      ? "사진과 함께 보낼 메시지 (선택) - 10MB 제한"
                      : "궁금한 차량 정보를 물어보세요... (사진 업로드 시 10MB 제한)"
                  }
                  disabled={loading}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    padding: "10px 14px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || (!input.trim() && !selectedFile)}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    backgroundColor:
                      loading || (!input.trim() && !selectedFile)
                        ? "#ccc"
                        : "#0F62FE",
                    color: "#ffffff",
                    fontSize: 13,
                    padding: "10px 18px",
                    cursor:
                      loading || (!input.trim() && !selectedFile)
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
                  }}
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const headerIconButtonStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#ffffff",
  cursor: "pointer",
  padding: "2px 4px",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};


