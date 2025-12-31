# 🔒 AWS SecOps 서비스 구축 계획 (회의용 요약)

## 📋 개요

AWS 마이그레이션 시 SecOps 관점에서 필요한 보안 서비스 구축 계획

---

## 🎯 서비스별 구축 계획

### 1. IAM (Identity and Access Management)

**무엇을**: 접근 제어 및 권한 관리 체계 구축

**왜**: 
- 멀티 어카운트 환경에서 중앙 집중식 권한 관리 필요
- 최소 권한 원칙 적용으로 보안 강화
- EKS Pod 레벨 권한 부여 (IRSA)

**어떻게**:
- Security Account에 보안 관리자 역할 생성
- 각 계정별 역할 분리 (SecurityAdmin, DevOps, ReadOnly)
- EKS Pod는 IRSA로 최소 권한만 부여
- MFA 강제, 정기적 권한 검토

**우선순위**: 🔴 최우선 (모든 서비스의 기반)

---

### 2. GuardDuty (위협 탐지)

**무엇을**: 자동 위협 탐지 및 대응 시스템

**왜**:
- 보안 사고 조기 발견
- 이상 행위 자동 탐지
- 컴플라이언스 준수

**어떻게**:
- Security Account에서 활성화 후 모든 계정 모니터링
- EventBridge와 연동하여 자동 대응
- 심각도 8.0 이상: 자동 격리 (Lambda)
- 심각도 7.0 이상: 긴급 알림 (SNS)

**우선순위**: 🟠 높음 (보안 핵심)

---

### 3. EventBridge (이벤트 라우팅)

**무엇을**: 보안 이벤트 자동 라우팅 및 처리

**왜**:
- 여러 서비스의 이벤트를 중앙에서 관리
- 자동 대응 워크플로우 구축
- 이벤트 기반 아키텍처

**어떻게**:
- GuardDuty 위협 탐지 → EventBridge → SNS/Lambda
- DocumentDB 장애 → EventBridge → SNS 알림
- 커스텀 애플리케이션 이벤트도 EventBridge로 통합

**우선순위**: 🟡 중간 (자동화를 위한 인프라)

---

### 4. SNS (Simple Notification Service)

**무엇을**: 보안/운영 알림 체계

**왜**:
- 위협 탐지 시 즉시 알림
- 장애 발생 시 빠른 대응
- 비용 초과 시 알림

**어떻게**:
- 토픽별 분리 (보안/운영/비용)
- 이메일, SMS, Slack 통합
- 심각도별 알림 채널 분리

**우선순위**: 🟡 중간 (알림을 위한 인프라)

---

### 5. KMS (Key Management Service)

**무엇을**: 암호화 키 관리 체계

**왜**:
- 모든 데이터 암호화 필수
- 키 관리 중앙화
- 컴플라이언스 준수

**어떻게**:
- 용도별 키 분리 (EBS, S3, Secrets Manager)
- 자동 키 로테이션
- 키 정책으로 접근 제어

**우선순위**: 🔴 최우선 (암호화 기반)

---

### 6. Secrets Manager (비밀 관리)

**무엇을**: 비밀 정보 자동 관리

**왜**:
- 수동 비밀번호 관리 위험 제거
- 자동 로테이션으로 보안 강화
- 감사 로그 자동 기록

**어떻게**:
- DocumentDB, Redis, JWT Secret 등 모든 비밀 정보 저장
- 30일마다 자동 로테이션
- External Secrets Operator로 Kubernetes와 연동

**우선순위**: 🟠 높음 (기존 Sealed Secret 대체)

---

### 7. Certificate Manager (인증서 관리)

**무엇을**: SSL/TLS 인증서 자동 관리

**왜**:
- 수동 인증서 관리 부담 제거
- 자동 갱신으로 만료 방지
- 비용 절감 (ACM 무료)

**어떻게**:
- 공개 인증서: ALB에 적용
- 프라이빗 인증서: 내부 서비스용
- 자동 갱신 (60일 전부터)

**우선순위**: 🟠 높음 (HTTPS 필수)

---

## 🏗️ 구축 단계

### Phase 1: 기반 구축 (1주)
- IAM 역할 구조 설정
- KMS 키 생성
- SNS 토픽 생성

### Phase 2: 위협 탐지 (1주)
- GuardDuty 활성화
- EventBridge 규칙 생성
- 자동 대응 Lambda 함수

### Phase 3: 비밀 관리 (1주)
- Secrets Manager Secret 생성
- 자동 로테이션 설정
- Kubernetes 연동

### Phase 4: 인증서 관리 (1주)
- ACM 인증서 요청
- ALB에 적용

**총 기간**: 4주

---

## 💰 예상 비용

**월간 비용**: 약 $10-20/월
- IAM: 무료
- KMS: $3/월 (3개 키)
- Secrets Manager: $4/월 (10개 secret)
- GuardDuty: $5/월 (로그량 기준)
- Certificate Manager: 무료
- EventBridge: $1-5/월
- SNS: $1-3/월

**비용 효과**: 기존 수동 관리 대비 인건비 75% 절감

---

## ✅ 기대 효과

### 보안 강화
- 자동 위협 탐지 및 대응
- 모든 데이터 암호화
- 비밀 정보 자동 로테이션

### 운영 효율성
- 수동 작업 자동화
- 알림 체계 구축
- 감사 로그 자동 기록

### 컴플라이언스
- 보안 정책 자동 강제
- 모든 접근 로깅
- 정기적 권한 검토

---

## 📋 체크리스트

### Phase 1
- [ ] IAM 역할 구조 설계
- [ ] KMS 키 생성
- [ ] SNS 토픽 생성

### Phase 2
- [ ] GuardDuty 활성화
- [ ] EventBridge 규칙 생성
- [ ] 자동 대응 Lambda 함수

### Phase 3
- [ ] Secrets Manager Secret 생성
- [ ] 자동 로테이션 설정
- [ ] Kubernetes 연동

### Phase 4
- [ ] ACM 인증서 요청
- [ ] ALB에 인증서 적용

---

**작성일**: 2024년
**버전**: 1.0 (회의용 요약)
**담당**: SecOps

