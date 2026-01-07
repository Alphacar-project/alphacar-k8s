// app/LeftAdBanner.js

"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

// 👉 화면 가로폭이 1700px 미만이면 배너 숨김 (기존 유지)
const HIDE_WIDTH = 1700;
// 헤더 높이 (GlobalHeader.tsx의 HEADER_HEIGHT와 동일)
const HEADER_HEIGHT = 124;
// 배너 초기 위치 (더 위로 이동)
const INITIAL_TOP = 200;

export default function LeftAdBanner() {
  const [isHidden, setIsHidden] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsHidden(window.innerWidth < HIDE_WIDTH);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setScrollY(window.scrollY);
      }
    };
    
    if (typeof window !== "undefined") {
      setScrollY(window.scrollY);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  if (isHidden || pathname === "/space-game") return null;

  // 스크롤 위치에 따라 배너의 top 위치 계산
  // 헤더가 배너에 닿으면 (스크롤이 INITIAL_TOP - HEADER_HEIGHT를 넘으면) 헤더 바로 아래에 고정
  const bannerTop = scrollY > INITIAL_TOP - HEADER_HEIGHT 
    ? scrollY + HEADER_HEIGHT + 20  // 헤더 바로 아래에 고정 (20px 여백)
    : INITIAL_TOP + scrollY;  // 스크롤과 함께 내려감

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        marginLeft: "-860px", // (기존 유지) 가로 위치 조절
        top: `${bannerTop}px`,
        zIndex: 40,
        transition: "top 0.1s ease-out",
      }}
    >
      <Link
        href="/space-game"
        style={{ display: "block", textDecoration: "none" }}
      >
        <div
          style={{
            width: "210px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            cursor: "pointer",
            fontSize: "0",
          }}
        >
          <img
            src="/ad/2026newyear-banner.png"
            alt="알파카 타고 크리스마스!!!"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
        </div>
      </Link>
    </div>
  );
}
