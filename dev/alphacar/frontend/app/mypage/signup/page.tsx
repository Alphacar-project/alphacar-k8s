// app/mypage/signup/page.tsx
"use client";

import SimpleModal from "../../components/SimpleModal";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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

function SignupContent() {
  const router = useRouter();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const togglePassword = () => {
    setPasswordVisible((prev) => !prev);
  };

  const toggleConfirmPassword = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  // 회원가입 처리
  const handleSignup = async () => {
    setErrorMessage("");

    // 유효성 검사
    if (!email || !password || !confirmPassword || !nickname) {
      setErrorMessage("모든 항목을 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (nickname.length < 2) {
      setErrorMessage("닉네임은 2자 이상이어야 합니다.");
      return;
    }

    try {
      const res = await fetch(`${window.location.origin}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          nickname 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(
          errorData.message || "회원가입에 실패했습니다. 다시 시도해주세요."
        );
        return;
      }

      const data = await res.json();

      if (data.access_token && data.user) {
        // 토큰 저장
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("alphacarToken", data.access_token);
        Cookies.set("accessToken", data.access_token, {
          expires: 7,
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
        });

        const userForMyPage = {
          nickname: data.user.nickname,
          email: data.user.email,
          provider: data.user.provider || "email",
          point: data.user.point ?? 0,
          quoteCount: data.user.quoteCount ?? 0,
        };
        localStorage.setItem("alphacarUser", JSON.stringify(userForMyPage));

        setShowSuccessModal(true);
      } else {
        setErrorMessage("회원가입 응답 형식이 예상과 다릅니다.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("서버 연결에 실패했습니다. 다시 시도해주세요.");
    }
  };

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
            회원가입
          </p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          {/* 에러 메시지 */}
          {errorMessage && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* 닉네임 */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            닉네임
          </div>
          <div
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: nicknameFocused ? "2px solid #667eea" : "2px solid #e5e7eb",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              marginBottom: "20px",
              transition: "all 0.2s ease",
              boxShadow: nicknameFocused
                ? "0 0 0 3px rgba(102, 126, 234, 0.1)"
                : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onFocus={() => setNicknameFocused(true)}
              onBlur={() => setNicknameFocused(false)}
              placeholder="닉네임을 입력하세요"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: "#111827",
              }}
            />
          </div>

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
              type="email"
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
              marginBottom: "20px",
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
              placeholder="비밀번호를 입력하세요 (8자 이상)"
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

          {/* 비밀번호 확인 */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            비밀번호 확인
          </div>
          <div
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              border: confirmPasswordFocused ? "2px solid #667eea" : "2px solid #e5e7eb",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 16px",
              marginBottom: "20px",
              transition: "all 0.2s ease",
              boxShadow: confirmPasswordFocused
                ? "0 0 0 3px rgba(102, 126, 234, 0.1)"
                : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
              placeholder="비밀번호를 다시 입력하세요"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: "#111827",
              }}
            />
            {confirmPassword.length > 0 && (
              <button
                type="button"
                onClick={toggleConfirmPassword}
                aria-label={confirmPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
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

          {/* 회원가입 버튼 */}
          <button
            type="button"
            onClick={handleSignup}
            style={{
              marginTop: "8px",
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
            회원가입
          </button>
        </div>

        {/* 로그인 링크 */}
        <div
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          이미 계정이 있으신가요?{" "}
          <button
            type="button"
            onClick={() => router.push("/mypage/login")}
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
            로그인
          </button>
        </div>
      </div>

      {/* 회원가입 성공 모달 */}
      <SimpleModal
        open={showSuccessModal}
        title="회원가입 완료"
        message={`${nickname}님, 환영합니다!\n회원가입이 완료되었습니다.`}
        confirmText="확인"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push("/mypage");
        }}
      />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>회원가입 페이지 로딩중...</div>}>
      <SignupContent />
    </Suspense>
  );
}

