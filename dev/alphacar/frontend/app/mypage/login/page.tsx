// app/mypage/login/page.js
"use client";

import SimpleModal from "../../components/SimpleModal"; // ✅ 경로 중요!
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ useSearchParams 추가
import Cookies from "js-cookie"; // ✅ js-cookie 추가

// 눈 아이콘 (비밀번호 보기)
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12C3.8 8.7 7.6 6 12 6C16.4 6 20.2 8.7 22 12C20.2 15.3 16.4 18 12 18C7.6 18 3.8 15.3 2 12Z"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
      />
    </svg>
  );
}

// 🔸 카카오톡 아이콘
function KakaoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ marginRight: 12 }}
    >
      <path
        d="M12 3C7.6 3 4 5.6 4 8.8c0 2.1 1.4 3.9 3.5 4.7l-1.1 3.7c-.1.3.2.5.4.4l3.8-2.1c.2.1.4.1.6.1.4 0 .8 0 1.2-.1 3.2-.3 5.6-2.3 5.6-5.1C19 5.6 15.4 3 12 3z"
        fill="#000000"
      />
    </svg>
  );
}

// 🔸 구글 아이콘
function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ marginRight: 12 }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// 🚨 Social ID를 localStorage에 저장
const saveSocialIdToLocalStorage = (socialId) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_social_id", socialId);
  }
};

// 🚨 오래된 인증 정보 삭제
const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user_social_id");
    localStorage.removeItem("alphacarToken");
    localStorage.removeItem("alphacarUser");
    localStorage.removeItem("alphacarUserNickname");
    // 로그아웃이나 초기화 시 쿠키도 삭제하는 것이 안전합니다.
    Cookies.remove("accessToken"); 
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ 쿼리 파라미터 가져오기

  // ✅ 로그인 후 이동할 주소 확인 (없으면 기본값 '/mypage')
  // 기존 로직이 /mypage로 이동하는 것이었으므로 기본값을 유지합니다.
  const callbackUrl = searchParams.get("callbackUrl") || "/mypage";

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [saveId, setSaveId] = useState(false);

  // 🔹 환영 모달용 상태
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  // ✅ 저장된 이메일 불러오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("savedEmail");
      if (savedEmail) {
        // JSON 형식인 경우 파싱, 아니면 그대로 사용 (호환성)
        try {
          const parsed = JSON.parse(savedEmail);
          if (parsed.email) {
            setEmail(parsed.email);
          } else {
            setEmail(savedEmail);
          }
        } catch {
          setEmail(savedEmail);
        }
        setSaveId(true);
      }
    }
  }, []);

  const togglePassword = () => {
    setPasswordVisible((prev) => !prev);
  };

  // ✅ 소셜 로그인 후 리다이렉트 파라미터 처리
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const socialId = params.get("socialId");
    const nickname = params.get("nickname");

    if (socialId) {
      clearAuthStorage();
      saveSocialIdToLocalStorage(socialId);

      // Social ID 저장 완료 (로그 제거)

      if (nickname) {
        localStorage.setItem("alphacarUserNickname", nickname);
      }

      const name = nickname || socialId;
      setWelcomeName(name);
      setShowWelcomeModal(true);
      // 여기서는 더 이상 alert / router.replace 안 함 (모달 확인 시 이동)
    }
  }, []);

  // 포트 번호 제거 헬퍼 함수
  const getRedirectUri = () => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    // 포트 번호 제거 (예: https://alphacar.cloud:31443 -> https://alphacar.cloud)
    const baseUrl = origin.replace(/:\d+$/, "");
    // Google OAuth 리다이렉트 URI는 정확히 일치해야 함
    return `${baseUrl}/mypage`;
  };

  // 🔵 구글 로그인 (백엔드 API를 통해 시작)
  const handleGoogleLogin = () => {
    // 백엔드 API 엔드포인트로 리다이렉트 (백엔드에서 Google OAuth 시작)
    window.location.href = `${window.location.origin}/api/auth/google`;
  };

  // ✅ 카카오 로그인
  const handleKakaoLogin = () => {
    const REST_API_KEY = "342d0463be260fc289926a0c63c4badc";
    
    // ❌ 시연용: 보안 취약점 - 하드코딩된 카카오 클라이언트 시크릿 (Quality Gate 실패 유발)
    const KAKAO_CLIENT_SECRET = "kakao_secret_key_never_commit_12345";
    const KAKAO_ADMIN_KEY = "kakao_admin_key_for_demo";
    const KAKAO_DATABASE_PASSWORD = "kakao_db_password_12345";
    
    // 현재 도메인 기반으로 리다이렉트 URI 설정 (ngrok 지원)
    const REDIRECT_URI = getRedirectUri();

    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoURL;
  };

  // 이메일 로그인 처리 + 유저정보 저장
  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(`${window.location.origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(
          errorData.message ||
            "로그인 실패: 이메일 또는 비밀번호를 확인해주세요.",
        );
        return;
      }

      const data = await res.json();

      if (data.access_token && data.user) {
        clearAuthStorage();

        // ✅ 아이디 저장 처리 (만료 기간 없음 - 계속 저장됨)
        if (saveId) {
          localStorage.setItem("savedEmail", email);
        } else {
          localStorage.removeItem("savedEmail");
        }

        // 1. 기존 로직: 로컬스토리지 저장 (accessToken으로 통일)
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("alphacarToken", data.access_token); // 호환성 유지

        // 2. ✅ [추가됨] 쿠키에 토큰 저장 (미들웨어 및 서버 컴포넌트용)
        // Cloudflare 환경에서는 HTTPS이므로 secure: true 유지
        // sameSite: "Lax"로 변경하여 페이지 간 이동 시 쿠키 전달 보장
        Cookies.set("accessToken", data.access_token, { 
          expires: 7, // 7일로 연장
          secure: window.location.protocol === 'https:', // HTTPS일 때만 secure
          sameSite: "Lax" // Strict -> Lax로 변경
        });

        if (data.user.socialId) {
          saveSocialIdToLocalStorage(data.user.socialId);
        }

        const userForMyPage = {
          nickname: data.user.nickname,
          email: data.user.email,
          provider: data.user.provider || "email",
          point: data.user.point ?? 0,
          quoteCount: data.user.quoteCount ?? 0,
        };
        localStorage.setItem("alphacarUser", JSON.stringify(userForMyPage));

        const name =
          data.user.nickname || data.user.email || "ALPHACAR 회원";
        setWelcomeName(name);
        setShowWelcomeModal(true);
        // 여기서 바로 router.push 하지 않고 모달의 onConfirm에서 처리
      } else {
        alert(
          "로그인 응답 형식이 예상과 다릅니다. 백엔드 응답을 확인해주세요.",
        );
      }
    } catch (error) {
      // 에러 처리 (콘솔 로그 제거)
      alert("서버 연결에 실패했습니다. 백엔드가 켜져있는지 확인해주세요.");
    }
  };

  // 🔻 UI
  return (
    <>
      <div
        style={{
          maxWidth: "480px",
          margin: "60px auto 100px",
          padding: "0 24px",
        }}
      >
        {/* 로고 영역 */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            ALPHACAR
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              marginTop: "8px",
              fontWeight: 400,
            }}
          >
            로그인 해주세요
          </p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          {/* 이메일 */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            이메일 주소
          </div>
          <div
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: emailFocused ? "2px solid #667eea" : "2px solid #e5e7eb",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              marginBottom: "20px",
              transition: "all 0.2s ease",
              boxShadow: emailFocused
                ? "0 0 0 3px rgba(102, 126, 234, 0.1)"
                : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="이메일을 입력하세요"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: "#111827",
              }}
            />
          </div>

          {/* 비밀번호 */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            비밀번호
          </div>
          <div
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: passwordFocused ? "2px solid #667eea" : "2px solid #e5e7eb",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 16px",
              transition: "all 0.2s ease",
              boxShadow: passwordFocused
                ? "0 0 0 3px rgba(102, 126, 234, 0.1)"
                : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="비밀번호를 입력하세요"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: "#111827",
              }}
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={togglePassword}
                aria-label={passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <EyeIcon />
              </button>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="button"
            onClick={handleEmailLogin}
            style={{
              marginTop: "28px",
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#667eea",
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(102, 126, 234, 0.4)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            로그인
          </button>

          {/* 아이디 저장 체크박스 */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            <input
              type="checkbox"
              id="saveId"
              checked={saveId}
              onChange={(e) => setSaveId(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "#667eea",
              }}
            />
            <label
              htmlFor="saveId"
              style={{
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              아이디 저장
            </label>
          </div>
        </div>

        {/* 구분선 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "#e5e7eb",
            }}
          />
          <span
            style={{
              padding: "0 16px",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            또는
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "#e5e7eb",
            }}
          />
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {/* 카카오 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#FEE500",
              fontSize: "15px",
              fontWeight: 600,
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(254, 229, 0, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(254, 229, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(254, 229, 0, 0.3)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KakaoIcon />
              <span>카카오로 로그인</span>
            </div>
          </button>

          {/* 구글 */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              backgroundColor: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GoogleIcon />
              <span>Google로 로그인</span>
            </div>
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={() => router.push("/mypage/signup")}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "14px",
              color: "#667eea",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            회원가입
          </button>
        </div>
      </div>

      {/* 🔹 로그인 성공 시 뜨는 환영 모달 */}
      <SimpleModal
        open={showWelcomeModal}
        title="ALPHACAR"
        message={`${welcomeName}님 환영합니다!`}
        confirmText="확인"
        onConfirm={() => {
          setShowWelcomeModal(false);
          // ✅ [변경됨] 원래 가려던 주소(callbackUrl)로 이동 (기본값: /mypage)
          router.replace(callbackUrl);
        }}
        onCancel={() => setShowWelcomeModal(false)}
      />
    </>
  );
}

// -----------------------------------------------------------
// 4. [핵심] Suspense로 감싸서 내보내기 (빌드 에러 해결!)
// -----------------------------------------------------------
export default function MyPageLogin() {
  return (
    <Suspense fallback={<div>로그인 페이지 로딩중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
