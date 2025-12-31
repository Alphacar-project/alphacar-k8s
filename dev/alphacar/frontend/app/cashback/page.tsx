"use client";

import { useEffect, useState, CSSProperties } from "react"; 

export default function CashbackPage() {
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setTodayStr(`${year}-${month}-${day}`);
  }, []);

  return (
    <div className="page-wrapper">
      <main
        style={{
          maxWidth: "1280px",
          margin: "40px auto 80px",
          padding: "0 20px",
        }}
      >
        {/* 상단 파란색 헤더 영역 - 기존 유지 */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              background: "#2563eb",
              padding: "48px 40px 40px",
              color: "#fff",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                textAlign: "left",
                opacity: 0.95,
                marginBottom: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ALPHACAR
            </div>
            <h1
              style={{
                fontSize: "42px",
                fontWeight: 800,
                margin: "16px 0 12px",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              최대 <span style={{ color: "#fbbf24", fontSize: "48px" }}>1.8%</span> 현금캐시백!
            </h1>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.95, fontWeight: 400 }}>
              {todayStr || "로딩 중..."} 기준
            </p>
          </div>
        </section>

        {/* 첫 번째 섹션: 카드 그리드 */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden",
            marginBottom: "40px",
            padding: "40px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1e293b",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            알파카 오토캐시백 1월 이벤트
          </h2>

          {/* 카드 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {/* A 카드 */}
            <CardBox
              color="#dc2626"
              label="A 카드"
              cardBenefit={{ percent: "0.9%", amount: "270,000원" }}
              getchaBenefit={{ percent: "0.8%", amount: "240,000원" }}
              total={{ percent: "1.7%", amount: "510,000원" }}
            />

            {/* D 카드 */}
            <CardBox
              color="#2563eb"
              label="D 카드"
              cardBenefit={{ percent: "1.3%", amount: "390,000원" }}
              getchaBenefit={{ percent: "0.3%", amount: "90,000원" }}
              total={{ percent: "1.6%", amount: "480,000원" }}
            />

            {/* C 카드 */}
            <CardBox
              color="#10b981"
              label="C 카드"
              cardBenefit={{ percent: "0.9%", amount: "270,000원" }}
              getchaBenefit={{ percent: "0.5%", amount: "150,000원" }}
              total={{ percent: "1.4%", amount: "420,000원" }}
            />

            {/* B 카드 */}
            <CardBox
              color="#1e40af"
              label="B 카드"
              cardBenefit={{ percent: "1.2%", amount: "360,000원" }}
              getchaBenefit={{ percent: "0.1%", amount: "30,000원" }}
              total={{ percent: "1.3%", amount: "390,000원" }}
            />

            {/* E 카드 */}
            <CardBox
              color="#6b7280"
              label="E 카드"
              cardBenefit={{ percent: "1.0%", amount: "300,000원" }}
              getchaBenefit={{ percent: "0.2%", amount: "60,000원" }}
              total={{ percent: "1.2%", amount: "360,000원" }}
            />

            {/* G 카드 */}
            <CardBox
              color="#3b82f6"
              label="G 카드"
              cardBenefit={{ percent: "0.7%", amount: "210,000원" }}
              getchaBenefit={{ percent: "0.5%", amount: "150,000원" }}
              total={{ percent: "1.2%", amount: "360,000원" }}
            />
          </div>
        </section>

        {/* 두 번째 섹션: 테이블 형태 */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden",
            marginBottom: "40px",
            padding: "40px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1e293b",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            알파카 오토캐시백 1월 이벤트
          </h2>

          {/* 테이블 */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                border: "1px solid #e5e7eb",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>기준</th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>A카드</th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>B카드</th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>C카드</th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>D카드</th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: "#1e293b", border: "1px solid #e5e7eb" }}>E카드</th>
                </tr>
              </thead>
              <tbody>
                {/* 1천만원 미만 */}
                <TableRowGroup
                  amount="1천만원 미만"
                  aCard={{ basic: "0.9%", getcha: "0.6%", total: "1.5%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />

                {/* 1천만원 이상 */}
                <TableRowGroup
                  amount="1천만원 이상"
                  aCard={{ basic: "0.9%", getcha: "0.6%", total: "1.5%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />

                {/* 2천만원 이상 */}
                <TableRowGroup
                  amount="2천만원 이상"
                  aCard={{ basic: "0.9%", getcha: "0.7%", total: "1.6%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />

                {/* 3천만원 이상 */}
                <TableRowGroup
                  amount="3천만원 이상"
                  aCard={{ basic: "0.9%", getcha: "0.8%", total: "1.7%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />

                {/* 4천만원 이상 */}
                <TableRowGroup
                  amount="4천만원 이상"
                  aCard={{ basic: "0.9%", getcha: "0.8%", total: "1.7%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />

                {/* 5천만원 이상 */}
                <TableRowGroup
                  amount="5천만원 이상"
                  aCard={{ basic: "0.9%", getcha: "0.9%", total: "1.8%" }}
                  bCard={{ basic: "1.2%", getcha: "0.1%", total: "1.3%" }}
                  cCard={{ basic: "0.9%", getcha: "0.5%", total: "1.4%" }}
                  dCard={{ basic: "1.3%", getcha: "0.3%", total: "1.6%" }}
                  eCard={{ basic: "1.0%", getcha: "0.2%", total: "1.2%" }}
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* 유의사항 섹션 */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: "40px",
          }}
        >
          <div
            style={{
              padding: "24px 28px",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1e293b",
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚠️</span> 유의사항
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: "24px",
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.9,
              }}
            >
              <li style={{ marginBottom: "10px" }}>
                카드사 캐시백, 추가 캐시백은 자동이체결제 건만 지급됩니다. (우리카드 제외)
              </li>
              <li style={{ marginBottom: "10px" }}>
                카드사 및 카드 혜택 변경기간 전 카드 해지 시 오토캐시백은 불가합니다.
              </li>
              <li>
                오토캐시백은 신용카드 혜택과 중복 적용 불가합니다.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * 카드 박스 컴포넌트 - 첫 번째 이미지 스타일
 */
function CardBox({ 
  color, 
  label, 
  cardBenefit, 
  getchaBenefit, 
  total 
}: { 
  color: string; 
  label: string; 
  cardBenefit: { percent: string; amount: string }; 
  getchaBenefit: { percent: string; amount: string }; 
  total: { percent: string; amount: string }; 
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
    >
      {/* 카드 이름 */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: color,
            color: "#fff",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
          }}
        >
          {label.charAt(0)}
        </div>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{label}</span>
      </div>

      {/* 카드사 혜택 */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>카드사 혜택</div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
          {cardBenefit.percent} <span style={{ fontSize: "14px", color: "#6b7280" }}>{cardBenefit.amount}</span>
        </div>
      </div>

      {/* 겟차 혜택 */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>겟차 혜택</div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
          {getchaBenefit.percent} <span style={{ fontSize: "14px", color: "#6b7280" }}>{getchaBenefit.amount}</span>
        </div>
      </div>

      {/* 혜택 합계 */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "2px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>혜택 합계</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#dc2626" }}>
          {total.percent} <span style={{ fontSize: "16px" }}>{total.amount}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 테이블 행 그룹 컴포넌트 - 두 번째 이미지 스타일
 */
function TableRowGroup({
  amount,
  aCard,
  bCard,
  cCard,
  dCard,
  eCard,
}: {
  amount: string;
  aCard: { basic: string; getcha: string; total: string };
  bCard: { basic: string; getcha: string; total: string };
  cCard: { basic: string; getcha: string; total: string };
  dCard: { basic: string; getcha: string; total: string };
  eCard: { basic: string; getcha: string; total: string };
}) {
  const cellStyle: CSSProperties = {
    padding: "12px 16px",
    textAlign: "center",
    fontSize: "14px",
    color: "#334155",
    border: "1px solid #e5e7eb",
  };

  const headerCellStyle: CSSProperties = {
    ...cellStyle,
    textAlign: "left",
    fontWeight: 600,
    background: "#f9fafb",
  };

  return (
    <>
      {/* 결제금액 헤더 행 */}
      <tr style={{ background: "#f1f5f9" }}>
        <td colSpan={6} style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b", fontSize: "15px", border: "1px solid #e5e7eb" }}>
          {amount}
        </td>
      </tr>
      {/* 기본 행 */}
      <tr>
        <td style={headerCellStyle}>기본</td>
        <td style={cellStyle}>{aCard.basic}</td>
        <td style={cellStyle}>{bCard.basic}</td>
        <td style={cellStyle}>{cCard.basic}</td>
        <td style={cellStyle}>{dCard.basic}</td>
        <td style={cellStyle}>{eCard.basic}</td>
      </tr>
      {/* 겟차혜택 행 */}
      <tr>
        <td style={headerCellStyle}>겟차혜택</td>
        <td style={cellStyle}>{aCard.getcha}</td>
        <td style={cellStyle}>{bCard.getcha}</td>
        <td style={cellStyle}>{cCard.getcha}</td>
        <td style={cellStyle}>{dCard.getcha}</td>
        <td style={cellStyle}>{eCard.getcha}</td>
      </tr>
      {/* 합계 행 */}
      <tr style={{ background: "#f9fafb" }}>
        <td style={{ ...headerCellStyle, fontWeight: 700 }}>합계</td>
        <td style={{ ...cellStyle, fontWeight: 700, color: "#dc2626" }}>{aCard.total}</td>
        <td style={{ ...cellStyle, fontWeight: 700, color: "#dc2626" }}>{bCard.total}</td>
        <td style={{ ...cellStyle, fontWeight: 700, color: "#dc2626" }}>{cCard.total}</td>
        <td style={{ ...cellStyle, fontWeight: 700, color: "#dc2626" }}>{dCard.total}</td>
        <td style={{ ...cellStyle, fontWeight: 700, color: "#dc2626" }}>{eCard.total}</td>
      </tr>
    </>
  );
}
