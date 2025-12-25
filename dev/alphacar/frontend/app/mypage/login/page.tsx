// app/mypage/login/page.js
"use client";

import SimpleModal from "../../components/SimpleModal"; // ✅ 경로 중요!
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ useSearchParams 추가
import Cookies from "js-cookie"; // ✅ js-cookie 추가

// 눈 아이콘 (비밀번호 보기)
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12C3.8 8.7 7.6 6 12 6C16.4 6 20.2 8.7 22 12C20.2 15.3 16.4 18 12 18C7.6 18 3.8 15.3 2 12Z"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 🔸 카카오톡 아이콘
function KakaoIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ marginRight: 12 }}
    >
      <circle cx="12" cy="12" r="12" fill="transparent" />
      <path
        d="M12 5C8.7 5 6 7.1 6 9.7C6 11.5 7.2 13.0 9.2 13.8L8.7 16.2C8.6 16.6 9.0 16.9 9.4 16.7L12.3 14.9C12.5 14.9 12.7 15 13 15C16.3 15 19 12.9 19 10.3C19 7.1 16.1 5 12 5Z"
        fill="#000000"
      />
    </svg>
  );
}

// 🔸 구글 아이콘
function GoogleIcon() {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#4285F4",
        }}
      >
        G
      </span>
    </div>
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

  // 🔹 환영 모달용 상태
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

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

      console.log(`[FE LOG 1] Social ID 저장 완료. Value: ${socialId}`);

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
    const origin = window.location.origin;
    // 포트 번호 제거 (예: https://alphacar.cloud:31443 -> https://alphacar.cloud)
    return origin.replace(/:\d+$/, "") + "/mypage";
  };

  // 🔵 구글 로그인
  const handleGoogleLogin = () => {
    const CLIENT_ID =
      "1030657487130-g7891k55pfhijc8gh1kedccnkf75v2qf.apps.googleusercontent.com";
    // 현재 도메인 기반으로 리다이렉트 URI 설정 (ngrok 지원)
    const REDIRECT_URI = getRedirectUri();

    const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email profile&state=google`;
    window.location.href = googleURL;
  };

  // ✅ 카카오 로그인
  const handleKakaoLogin = () => {
    const REST_API_KEY = "342d0463be260fc289926a0c63c4badc";
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

        // 1. 기존 로직: 로컬스토리지 저장
        localStorage.setItem("alphacarToken", data.access_token);

        // 2. ✅ [추가됨] 쿠키에 토큰 저장 (미들웨어 및 서버 컴포넌트용)
        Cookies.set("accessToken", data.access_token, { 
          expires: 1, 
          secure: true, 
          sameSite: "Strict" 
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
      console.error(error);
      alert("서버 연결에 실패했습니다. 백엔드가 켜져있는지 확인해주세요.");
    }
  };

  // 🔻 UI
  return (
    <>
      <div
        style={{
          maxWidth: "520px",
          margin: "80px auto 120px",
          padding: "0 24px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            marginBottom: "32px",
          }}
        >
          ALPHACAR
        </h1>

        <div style={{ marginBottom: "32px" }}>
          {/* 이메일 */}
          <div
            style={{
              fontSize: "14px",
              marginBottom: "6px",
            }}
          >
            이메일 주소
          </div>
          <div
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              marginBottom: "18px",
            }}
          >
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          {/* 비밀번호 */}
          <div
            style={{
              fontSize: "14px",
              marginBottom: "6px",
            }}
          >
            비밀번호
          </div>
          <div
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 12px",
            }}
          >
            <input
              type="password" // ⚠️ 원본 코드에 visible logic이 있었으나 type이 고정되어 있었을 수 있음. 여기서는 토글 로직 적용
              // (원본 코드에서 type={passwordVisible ? "text" : "password"} 로 되어 있었으므로 그대로 유지)
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
              }}
              // ⬇️ 원본의 토글 로직 적용
              {...{ type: passwordVisible ? "text" : "password" }}
            />
            <button
              type="button"
              onClick={togglePassword}
              aria-label={passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeIcon />
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="button"
            onClick={handleEmailLogin}
            style={{
              marginTop: "24px",
              width: "100%",
              height: "56px",
              borderRadius: "999px",
              border: "1px solid #ddd",
              backgroundColor: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            로그인
          </button>

          {/* 아이디 저장 체크박스 */}
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#555",
            }}
          >
            <input type="checkbox" id="saveId" />
            <label htmlFor="saveId">아이디 저장</label>
          </div>
        </div>

        {/* 아이디/비번 찾기 + 회원가입 */}
        <div
          style={{
            marginBottom: "28px",
            fontSize: "13px",
            color: "#555",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <button
            type="button"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "13px",
              color: "#555",
            }}
          >
            아이디/비밀번호 찾기
          </button>
          <span>|</span>
          <button
            type="button"
            style={{
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "13px",
              color: "#555",
            }}
          >
            회원가입
          </button>
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
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#FEE500",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#1877F2",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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

        <p
          style={{
            marginTop: "18px",
            fontSize: "11px",
            color: "#777",
            textAlign: "center",
          }}
        >
          (회원가입 안되어 있으시면 회원가입해 주세요.)
        </p>
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
