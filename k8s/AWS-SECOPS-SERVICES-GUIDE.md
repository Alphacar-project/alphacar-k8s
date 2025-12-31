# 🔒 AWS SecOps 서비스 통합 가이드

## 📋 목차
1. [서비스 개요 및 역할](#서비스-개요-및-역할)
2. [IAM (Identity and Access Management)](#iam-identity-and-access-management)
3. [GuardDuty (위협 탐지)](#guardduty-위협-탐지)
4. [EventBridge (이벤트 기반 아키텍처)](#eventbridge-이벤트-기반-아키텍처)
5. [SNS (Simple Notification Service)](#sns-simple-notification-service)
6. [KMS (Key Management Service)](#kms-key-management-service)
7. [Secrets Manager (비밀 관리)](#secrets-manager-비밀-관리)
8. [Certificate Manager (인증서 관리)](#certificate-manager-인증서-관리)
9. [통합 아키텍처](#통합-아키텍처)
10. [구현 단계별 가이드](#구현-단계별-가이드)

---

## 🎯 서비스 개요 및 역할

### SecOps 서비스 매핑

| 서비스 | 역할 | 우선순위 | 비용 |
|--------|------|----------|------|
| **IAM** | 접근 제어 및 권한 관리 | 🔴 최우선 | 무료 |
| **KMS** | 암호화 키 관리 | 🔴 최우선 | $1/월 + 사용량 |
| **Secrets Manager** | 비밀 정보 관리 | 🟠 높음 | $0.40/secret/월 |
| **GuardDuty** | 위협 탐지 | 🟠 높음 | $0.10/GB/월 |
| **Certificate Manager** | SSL/TLS 인증서 | 🟠 높음 | 무료 (ACM 인증서) |
| **EventBridge** | 이벤트 라우팅 | 🟡 중간 | $1/백만 이벤트 |
| **SNS** | 알림 서비스 | 🟡 중간 | $0.50/백만 요청 |

---

## 🔐 IAM (Identity and Access Management)

### 역할 및 책임

#### 1. 멀티 어카운트 IAM 구조

```
AWS Organizations (루트)
├── Security Account
│   ├── SecurityAdminRole (보안 관리자)
│   ├── SecurityAuditRole (감사자)
│   └── SecurityReadOnlyRole (읽기 전용)
├── Shared Services Account
│   ├── DevOpsRole (인프라 관리)
│   └── CICDRole (CI/CD)
├── Dev/Staging/Production Accounts
│   ├── EKSPodRole (Pod 레벨 IAM)
│   ├── AppRole (애플리케이션 역할)
│   └── ReadOnlyRole (모니터링)
```

### 2. IAM 역할 생성

#### Security Account - 보안 관리자 역할

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "guardduty:*",
        "securityhub:*",
        "config:*",
        "kms:*",
        "secretsmanager:*",
        "acm:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:GetRole",
        "iam:ListRoles",
        "iam:GetPolicy",
        "iam:ListPolicies"
      ],
      "Resource": "*"
    }
  ]
}
```

#### EKS Pod 역할 (IRSA - IAM Roles for Service Accounts)

```yaml
# 1. IAM 역할 생성
apiVersion: v1
kind: ServiceAccount
metadata:
  name: documentdb-access-sa
  namespace: apc-be-ns
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/EKSPodDocumentDBRole
---
# 2. IAM 정책 (DocumentDB 접근)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds-db:region:account:dbuser:cluster-id/username"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:region:account:secret:docdb-credentials-*"
    }
  ]
}
```

### 3. 최소 권한 원칙 적용

```json
// 예: DocumentDB 접근만 허용
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "docdb:DescribeDBClusters",
        "docdb:Connect"
      ],
      "Resource": "arn:aws:docdb:region:account:cluster:alphacar-docdb"
    },
    {
      "Effect": "Deny",
      "Action": [
        "docdb:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["ap-northeast-2"]
        }
      }
    }
  ]
}
```

### 4. IAM 모범 사례

**1. 역할 기반 접근 제어 (RBAC)**
- 사용자 직접 권한 부여 금지
- 역할을 통해서만 권한 부여
- 정기적인 권한 검토

**2. MFA 강제**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

**3. 접근 로그 활성화**
- CloudTrail 활성화 (모든 API 호출 로깅)
- S3에 로그 저장 (암호화)

---

## 🛡️ GuardDuty (위협 탐지)

### 1. GuardDuty 활성화

```bash
# Security Account에서 활성화
aws guardduty create-detector \
  --enable \
  --finding-publishing-frequency FIFTEEN_MINUTES

# 멀티 어카운트 구성
aws guardduty create-members \
  --detector-id DETECTOR_ID \
  --account-details accountId=ACCOUNT_ID,email=admin@alphacar.com
```

### 2. 위협 탐지 설정

#### 위협 유형별 대응

```json
{
  "FindingCriteria": {
    "Criterion": {
      "severity": {
        "Gte": 7.0
      },
      "type": {
        "Equals": [
          "Recon:EC2/PortProbeUnprotectedPort",
          "UnauthorizedAPICall:EC2/EC2InstanceConnect",
          "Stealth:EC2/EC2InstanceConnect"
        ]
      }
    }
  },
  "Actions": [
    {
      "ActionType": "ARCHIVE_FINDING"
    }
  ]
}
```

### 3. EventBridge와 통합

```yaml
# GuardDuty → EventBridge → SNS
apiVersion: v1
kind: ConfigMap
metadata:
  name: guardduty-eventbridge-config
data:
  rule.json: |
    {
      "Rules": [
        {
          "Name": "GuardDutyHighSeverityFindings",
          "EventPattern": {
            "source": ["aws.guardduty"],
            "detail-type": ["GuardDuty Finding"],
            "detail": {
              "severity": {
                "numeric": [">=", 7.0]
              }
            }
          },
          "Targets": [
            {
              "Arn": "arn:aws:sns:region:account:security-alerts",
              "Id": "SecurityAlertsSNS"
            }
          ]
        }
      ]
    }
```

### 4. 위협 대응 자동화

```python
# Lambda 함수: GuardDuty 위협 대응
import boto3
import json

def lambda_handler(event, context):
    guardduty = boto3.client('guardduty')
    ec2 = boto3.client('ec2')
    
    finding = event['detail']
    
    # 심각도 8.0 이상이면 인스턴스 격리
    if finding['severity'] >= 8.0:
        instance_id = finding['resource']['instanceDetails']['instanceId']
        
        # 보안 그룹 변경 (격리)
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=['sg-isolation']  # 격리용 보안 그룹
        )
        
        # SNS 알림
        sns = boto3.client('sns')
        sns.publish(
            TopicArn='arn:aws:sns:region:account:security-incidents',
            Message=f"인스턴스 {instance_id}가 위협으로 인해 격리되었습니다.",
            Subject="[긴급] 인스턴스 격리"
        )
    
    return {'statusCode': 200}
```

---

## 📡 EventBridge (이벤트 기반 아키텍처)

### 1. EventBridge 규칙 생성

#### 보안 이벤트 규칙

```bash
# GuardDuty 위협 탐지 → SNS 알림
aws events put-rule \
  --name guardduty-high-severity \
  --event-pattern '{
    "source": ["aws.guardduty"],
    "detail-type": ["GuardDuty Finding"],
    "detail": {
      "severity": {
        "numeric": [">=", 7.0]
      }
    }
  }' \
  --state ENABLED

# 타겟 설정 (SNS)
aws events put-targets \
  --rule guardduty-high-severity \
  --targets "Id=1,Arn=arn:aws:sns:region:account:security-alerts"
```

#### 인프라 이벤트 규칙

```bash
# DocumentDB 장애 → SNS 알림
aws events put-rule \
  --name docdb-failure \
  --event-pattern '{
    "source": ["aws.rds"],
    "detail-type": ["RDS DB Instance Event"],
    "detail": {
      "EventCategories": ["failure", "maintenance"]
    }
  }' \
  --state ENABLED
```

### 2. 커스텀 이벤트 (애플리케이션 레벨)

```python
# 애플리케이션에서 이벤트 발행
import boto3
import json

eventbridge = boto3.client('events')

def publish_custom_event(event_type, data):
    response = eventbridge.put_events(
        Entries=[
            {
                'Source': 'alphacar.application',
                'DetailType': event_type,
                'Detail': json.dumps(data),
                'EventBusName': 'default'
            }
        ]
    )
    return response

# 사용 예시
publish_custom_event(
    'UserLoginFailed',
    {
        'userId': 'user123',
        'ip': '192.168.1.1',
        'timestamp': '2024-01-01T00:00:00Z'
    }
)
```

### 3. 이벤트 라우팅 전략

```
애플리케이션 이벤트
  ↓
EventBridge
  ├─→ SNS (알림)
  ├─→ Lambda (자동 대응)
  ├─→ SQS (비동기 처리)
  └─→ CloudWatch Logs (로깅)
```

---

## 📢 SNS (Simple Notification Service)

### 1. SNS 토픽 생성

```bash
# 보안 알림 토픽
aws sns create-topic --name security-alerts

# 운영 알림 토픽
aws sns create-topic --name operations-alerts

# 비용 알림 토픽
aws sns create-topic --name cost-alerts
```

### 2. 구독 설정

#### 이메일 구독

```bash
# 보안 알림 구독
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:security-alerts \
  --protocol email \
  --notification-endpoint security@alphacar.com

# 운영 알림 구독
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:operations-alerts \
  --protocol email \
  --notification-endpoint ops@alphacar.com
```

#### SMS 구독 (긴급 알림)

```bash
# 긴급 보안 알림 (SMS)
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:security-alerts \
  --protocol sms \
  --notification-endpoint +821012345678
```

#### Slack 통합 (Lambda를 통한)

```python
# Lambda: SNS → Slack
import json
import urllib.request
import urllib.parse

def lambda_handler(event, context):
    sns_message = json.loads(event['Records'][0]['Sns']['Message'])
    
    slack_webhook_url = os.environ['SLACK_WEBHOOK_URL']
    
    slack_message = {
        'text': f"🚨 보안 알림\n{sns_message['message']}",
        'username': 'AWS Security Bot',
        'icon_emoji': ':warning:'
    }
    
    req = urllib.request.Request(
        slack_webhook_url,
        data=json.dumps(slack_message).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    urllib.request.urlopen(req)
    
    return {'statusCode': 200}
```

### 3. 알림 정책 설정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "SNS:Publish",
      "Resource": "arn:aws:sns:region:account:security-alerts"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account:role/SecurityAdminRole"
      },
      "Action": [
        "SNS:Subscribe",
        "SNS:Unsubscribe"
      ],
      "Resource": "arn:aws:sns:region:account:security-alerts"
    }
  ]
}
```

---

## 🔑 KMS (Key Management Service)

### 1. KMS 키 생성 전략

#### 키 계층 구조

```
┌─────────────────────────────────┐
│  Master Key (CMK)               │
│  - 용도: 전체 암호화 관리        │
│  - 권한: Security Admin만       │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────┐
│ EBS Key│      │S3 Key   │
│        │      │         │
│ EBS    │      │ S3      │
│ 암호화 │      │ 암호화  │
└────────┘      └─────────┘
```

#### 키 생성

```bash
# EBS 암호화용 키
aws kms create-key \
  --description "EBS encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

# S3 암호화용 키
aws kms create-key \
  --description "S3 encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

# Secrets Manager용 키
aws kms create-key \
  --description "Secrets Manager encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT
```

### 2. 키 정책 설정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Security Admin",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account:role/SecurityAdminRole"
      },
      "Action": [
        "kms:Create*",
        "kms:Describe*",
        "kms:Enable*",
        "kms:List*",
        "kms:Put*",
        "kms:Update*",
        "kms:Revoke*",
        "kms:Disable*",
        "kms:Get*",
        "kms:Delete*",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ScheduleKeyDeletion",
        "kms:CancelKeyDeletion"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow EBS to use key",
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:CreateGrant"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ec2.ap-northeast-2.amazonaws.com"
        }
      }
    }
  ]
}
```

### 3. 키 로테이션

```bash
# 자동 키 로테이션 활성화
aws kms enable-key-rotation --key-id KEY_ID

# 수동 키 로테이션 (필요 시)
aws kms create-alias \
  --alias-name alias/ebs-encryption-key-v2 \
  --target-key-id NEW_KEY_ID
```

### 4. EBS 암호화 적용

```yaml
# StorageClass에 KMS 키 지정
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-encrypted
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:region:account:key/KEY_ID"
```

---

## 🔐 Secrets Manager (비밀 관리)

### 1. Secret 생성

```bash
# DocumentDB 비밀번호
aws secretsmanager create-secret \
  --name alphacar/docdb-password \
  --description "DocumentDB master password" \
  --secret-string '{"username":"admin","password":"NEW_PASSWORD"}' \
  --kms-key-id alias/aws/secretsmanager

# Redis 비밀번호
aws secretsmanager create-secret \
  --name alphacar/redis-password \
  --description "ElastiCache Redis password" \
  --secret-string "REDIS_PASSWORD" \
  --kms-key-id alias/aws/secretsmanager

# JWT Secret
aws secretsmanager create-secret \
  --name alphacar/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "JWT_SECRET_KEY" \
  --kms-key-id alias/aws/secretsmanager
```

### 2. 자동 로테이션 설정

```bash
# DocumentDB 비밀번호 자동 로테이션
aws secretsmanager rotate-secret \
  --secret-id alphacar/docdb-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:RotateDocumentDBSecret \
  --rotation-rules AutomaticallyAfterDays=30
```

#### Lambda 함수: 자동 로테이션

```python
import boto3
import json
import random
import string

def lambda_handler(event, context):
    secretsmanager = boto3.client('secretsmanager')
    docdb = boto3.client('docdb')
    
    # 새 비밀번호 생성
    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    # DocumentDB 비밀번호 변경
    docdb.modify_db_cluster(
        DBClusterIdentifier='alphacar-docdb',
        MasterUserPassword=new_password,
        ApplyImmediately=True
    )
    
    # Secrets Manager 업데이트
    secretsmanager.update_secret(
        SecretId=event['SecretId'],
        SecretString=json.dumps({
            'username': 'admin',
            'password': new_password
        })
    )
    
    return {'statusCode': 200}
```

### 3. Kubernetes 통합 (External Secrets Operator)

```yaml
# External Secrets Operator 설치
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/charts/external-secrets/templates/crds/secretstore.yaml

# SecretStore 생성
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: apc-be-ns
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
# ExternalSecret 생성
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: docdb-credentials
  namespace: apc-be-ns
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: docdb-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: alphacar/docdb-password
      property: username
  - secretKey: password
    remoteRef:
      key: alphacar/docdb-password
      property: password
```

### 4. 접근 제어

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account:role/EKSPodDocumentDBRole"
      },
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:region:account:secret:alphacar/docdb-password-*"
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "secretsmanager:*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    }
  ]
}
```

---

## 🔒 Certificate Manager (인증서 관리)

### 1. SSL/TLS 인증서 요청

```bash
# 공개 인증서 요청 (ALB용)
aws acm request-certificate \
  --domain-name alphacar.com \
  --subject-alternative-names "*.alphacar.com" \
  --validation-method DNS \
  --region ap-northeast-2

# 프라이빗 인증서 요청 (내부 서비스용)
aws acm request-certificate \
  --domain-name "*.internal.alphacar.com" \
  --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
  --region ap-northeast-2
```

### 2. DNS 검증

```bash
# DNS 검증 레코드 확인
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:region:account:certificate/CERT_ID \
  --query 'Certificate.DomainValidationOptions'

# Route53에 자동 검증 (자동화)
aws acm-pca issue-certificate \
  --certificate-authority-arn arn:aws:acm-pca:region:account:certificate-authority/CA_ID \
  --csr file://csr.pem \
  --signing-algorithm SHA256WITHRSA \
  --validity Value=365,Type=DAYS
```

### 3. ALB에 인증서 적용

```yaml
# ALB Ingress Controller 설정
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alphacar-ingress
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/CERT_ID
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
spec:
  ingressClassName: alb
  rules:
  - host: alphacar.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 4. 자동 갱신

```bash
# 인증서 자동 갱신 (ACM이 자동 처리)
# 60일 전부터 자동 갱신 시작

# 갱신 알림 설정
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:certificate-alerts \
  --protocol email \
  --notification-endpoint security@alphacar.com
```

---

## 🏗️ 통합 아키텍처

### 전체 보안 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Security Account                        │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │GuardDuty │───▶│EventBridge│───▶│   SNS   │          │
│  │(위협탐지)│    │(이벤트)  │    │(알림)   │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │   KMS    │───▶│Secrets   │───▶│Certificate│         │
│  │  (키)    │    │Manager   │    │Manager   │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │            IAM (중앙 관리)                │           │
│  │  - SecurityAdminRole                      │           │
│  │  - EKSPodRole (IRSA)                      │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Production Account                          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │DocumentDB│───▶│Secrets   │───▶│   KMS    │          │
│  │(암호화)  │    │Manager   │    │(키)     │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │   EBS    │───▶│   KMS    │    │Certificate│         │
│  │(암호화)  │    │(키)     │    │(ALB)     │          │
│  └──────────┘    └──────────┘    └──────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 이벤트 흐름

```
1. GuardDuty 위협 탐지
   ↓
2. EventBridge 이벤트 수신
   ↓
3. 이벤트 규칙 평가
   ├─→ 심각도 8.0 이상: Lambda (자동 격리)
   ├─→ 심각도 7.0 이상: SNS (긴급 알림)
   └─→ 일반: SNS (일반 알림)
   ↓
4. SNS 알림 발송
   ├─→ 이메일 (security@alphacar.com)
   ├─→ SMS (긴급)
   └─→ Slack (Lambda를 통한)
```

---

## 📋 구현 단계별 가이드

### Phase 1: 기반 구축 (1주)

#### 1.1 IAM 구조 설정
```bash
# Security Account에서 실행
# 1. SecurityAdminRole 생성
aws iam create-role \
  --role-name SecurityAdminRole \
  --assume-role-policy-document file://trust-policy.json

# 2. 정책 부여
aws iam attach-role-policy \
  --role-name SecurityAdminRole \
  --policy-arn arn:aws:iam::aws:policy/SecurityAudit
```

#### 1.2 KMS 키 생성
```bash
# EBS 암호화 키
aws kms create-key --description "EBS encryption"

# Secrets Manager 키
aws kms create-key --description "Secrets Manager encryption"

# S3 암호화 키
aws kms create-key --description "S3 encryption"
```

#### 1.3 SNS 토픽 생성
```bash
aws sns create-topic --name security-alerts
aws sns create-topic --name operations-alerts
aws sns create-topic --name cost-alerts
```

### Phase 2: 위협 탐지 설정 (1주)

#### 2.1 GuardDuty 활성화
```bash
# Security Account
aws guardduty create-detector --enable

# 멀티 어카운트 구성
aws guardduty create-members \
  --detector-id DETECTOR_ID \
  --account-details accountId=PROD_ACCOUNT,email=admin@alphacar.com
```

#### 2.2 EventBridge 규칙 생성
```bash
# GuardDuty → SNS
aws events put-rule \
  --name guardduty-high-severity \
  --event-pattern file://guardduty-pattern.json \
  --state ENABLED

aws events put-targets \
  --rule guardduty-high-severity \
  --targets "Id=1,Arn=arn:aws:sns:region:account:security-alerts"
```

### Phase 3: 비밀 관리 설정 (1주)

#### 3.1 Secrets Manager Secret 생성
```bash
# DocumentDB 비밀번호
aws secretsmanager create-secret \
  --name alphacar/docdb-password \
  --secret-string file://docdb-secret.json

# 자동 로테이션 설정
aws secretsmanager rotate-secret \
  --secret-id alphacar/docdb-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:RotateSecret
```

#### 3.2 External Secrets Operator 설치
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system
```

### Phase 4: 인증서 관리 (1주)

#### 4.1 ACM 인증서 요청
```bash
aws acm request-certificate \
  --domain-name alphacar.com \
  --subject-alternative-names "*.alphacar.com" \
  --validation-method DNS
```

#### 4.2 ALB에 인증서 적용
```yaml
# Ingress 설정에 인증서 ARN 추가
annotations:
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/CERT_ID
```

---

## 📊 비용 예상

### 월간 비용 (Production 기준)

| 서비스 | 비용 | 비고 |
|--------|------|------|
| **IAM** | $0 | 무료 |
| **KMS** | $1 + $0.03/10,000 요청 | 키당 $1/월 |
| **Secrets Manager** | $0.40/secret/월 | 10개 기준 $4/월 |
| **GuardDuty** | $0.10/GB/월 | 로그 수집량에 따라 |
| **Certificate Manager** | $0 | ACM 공개 인증서 무료 |
| **EventBridge** | $1/백만 이벤트 | 일반적으로 $1-5/월 |
| **SNS** | $0.50/백만 요청 | 일반적으로 $1-3/월 |
| **총계** | **$10-20/월** | |

---

## ✅ 체크리스트

### IAM
- [ ] Security Account 역할 생성
- [ ] EKS Pod 역할 (IRSA) 설정
- [ ] 최소 권한 원칙 적용
- [ ] MFA 강제 설정
- [ ] 정기적인 권한 검토

### GuardDuty
- [ ] GuardDuty 활성화
- [ ] 멀티 어카운트 구성
- [ ] EventBridge 통합
- [ ] 위협 대응 자동화 (Lambda)

### EventBridge
- [ ] 보안 이벤트 규칙 생성
- [ ] 인프라 이벤트 규칙 생성
- [ ] 커스텀 이벤트 설정
- [ ] 타겟 설정 (SNS, Lambda)

### SNS
- [ ] 보안 알림 토픽 생성
- [ ] 운영 알림 토픽 생성
- [ ] 구독 설정 (이메일, SMS, Slack)
- [ ] 알림 정책 설정

### KMS
- [ ] EBS 암호화 키 생성
- [ ] S3 암호화 키 생성
- [ ] Secrets Manager 키 생성
- [ ] 키 정책 설정
- [ ] 자동 키 로테이션 활성화

### Secrets Manager
- [ ] DocumentDB 비밀번호 생성
- [ ] Redis 비밀번호 생성
- [ ] JWT Secret 생성
- [ ] 자동 로테이션 설정
- [ ] External Secrets Operator 설치

### Certificate Manager
- [ ] 공개 인증서 요청
- [ ] DNS 검증 완료
- [ ] ALB에 인증서 적용
- [ ] 자동 갱신 확인

---

## 🔗 관련 문서

- [AWS IAM 모범 사례](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GuardDuty 사용자 가이드](https://docs.aws.amazon.com/guardduty/)
- [EventBridge 이벤트 패턴](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
- [Secrets Manager 자동 로테이션](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [KMS 모범 사례](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)

---

**작성일**: 2024년
**버전**: 1.0
**담당**: SecOps

