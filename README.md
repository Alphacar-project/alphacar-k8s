# 🚗 Alphacar (알파카)
> **Next-Generation Automotive MSA Platform with AI-Driven Observability**

Alphacar는 **마이크로서비스 아키텍처(MSA)**를 기반으로 설계된 종합 자동차 서비스 플랫폼입니다. 단순한 서비스 제공을 넘어, **AWS와 GCP를 활용한 멀티 클라우드 환경**에서 운영되며, **AI(AWS Bedrock)를 활용한 지능형 모니터링 및 챗봇** 시스템을 갖춘 고도화된 인프라 프로젝트입니다.

---

## ✨ 핵심 차별점 (Key Highlights)

* **Cloud Native & MSA**: 7개 이상의 독립적인 마이크로서비스가 Kubernetes 환경에서 유기적으로 작동합니다.
* **Multi-Cloud Strategy**: AWS EKS와 GCP GKE를 VPN으로 연결하여 클라우드 종속성을 탈피하고 가용성을 극대화했습니다.
* **AI-Powered Observability**: AWS Bedrock을 연동하여 메트릭, 로그, 트레이스를 AI가 스스로 분석하고 리포팅합니다.
* **GitOps & IaC**: ArgoCD와 Terraform을 활용하여 선언적 인프라 관리 및 배포 자동화를 실현했습니다.

---

## 🛠 기술 스택 (Tech Stack)

### 🏗 Infrastructure & DevOps
| 분류 | 기술 스택 |
| :--- | :--- |
| **Cloud** | AWS (EKS, Bedrock, Route53, VPN), GCP (GKE) |
| **Orchestration** | Kubernetes, Docker, Helm |
| **CI/CD / GitOps** | ArgoCD, Jenkins, Harbor, Terraform |
| **Observability** | Prometheus, Grafana, Loki, Tempo, Grafana Alloy |
| **Security** | Sealed Secrets, Traefik Ingress, SonarQube |

### 💻 Application Development
| 분류 | 기술 스택 |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Backend** | NestJS (Microservices), Node.js 20+, Express |
| **Database** | MongoDB, MySQL, Redis, Elasticsearch |
| **AI / ML** | AWS Bedrock Runtime, LangChain, FAISS (Vector Store) |

---

## 🏗 시스템 아키텍처 (Architecture)



### 주요 서비스 모듈
* **Main API**: 서비스 통합 게이트웨이 및 핵심 비즈니스 로직 처리
* **AI Chat**: AWS Bedrock 기반 자동차 전문 상담 및 지능형 챗봇 서비스
* **Community / News**: 사용자 커뮤니티 및 실시간 자동차 트렌드 정보 제공
* **Quote / Search**: 고도화된 자동차 견적 산출 알고리즘 및 고성능 검색 엔진
* **Monitoring Analysis**: AI 기반 텔레메트리 데이터 분석 및 시각화 전용 서비스

---

## 📊 AI 기반 관측성 (AI-Driven Observability)

본 프로젝트는 단순한 모니터링을 넘어 **"지능형 관측"**을 지향합니다.

* **Metric Analysis**: Prometheus 메트릭을 분석하여 이상 징후 발생 시 AI가 예상 원인을 추론합니다.
* **Log & Trace Insight**: 분산 추적(Tracing) 데이터를 분석하여 마이크로서비스 간 병목 지점을 특정합니다.
* **Automated Reporting**: k6 부하 테스트 결과와 연동하여 AI가 생성한 성능 분석 리포트를 제공합니다.
* **Smart Alerting**: Slack과 연동되어 장애 상황을 자연어로 요약하여 알림을 전송합니다.

---

## 📁 프로젝트 구조 (Project Structure)

```text
alphacar/
├── dev/                     # 애플리케이션 소스 코드
│   ├── frontend/            # Next.js 프론트엔드
│   └── backend/             # NestJS 기반 마이크로서비스 (Main, AI, News 등)
├── k8s/                     # Kubernetes 매니페스트 (Namespace, Deployment, HPA 등)
│   ├── monitoring/          # 모니터링 스택 (Prometheus, Grafana, Loki)
│   └── cicd/                # 배포 설정 (ArgoCD, Harbor)
├── terraform/               # IaC 기반 인프라 구성 (AWS/GCP)
└── monitoring-analysis/     # AI 분석 시스템 대시보드 및 백엔드
