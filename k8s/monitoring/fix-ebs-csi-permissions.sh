#!/bin/bash
set -e

CLUSTER_NAME="apc-eks-cluster"
REGION="ap-northeast-2"
OIDC_ISSUER="oidc.eks.ap-northeast-2.amazonaws.com/id/544A4D4C61F45C8AA9AAD7838CFD37B2"
SERVICE_ACCOUNT_NAME="ebs-csi-controller-sa"
SERVICE_ACCOUNT_NAMESPACE="kube-system"
ROLE_NAME="AmazonEKS_EBS_CSI_DriverRole"

echo "🔧 Setting up EBS CSI Driver IAM Role with IRSA..."

# 1. Create IAM role trust policy
echo "📝 Creating IAM role trust policy..."
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::382045063773:oidc-provider/${OIDC_ISSUER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_ISSUER}:sub": "system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}",
          "${OIDC_ISSUER}:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF

# 2. Create IAM policy for EBS CSI driver
echo "📝 Creating IAM policy..."
cat > /tmp/ebs-csi-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSnapshot",
        "ec2:AttachVolume",
        "ec2:DetachVolume",
        "ec2:ModifyVolume",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeInstances",
        "ec2:DescribeSnapshots",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DescribeVolumesModifications"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateTags"
      ],
      "Resource": [
        "arn:aws:ec2:${REGION}:*:volume/*",
        "arn:aws:ec2:${REGION}:*:snapshot/*"
      ],
      "Condition": {
        "StringEquals": {
          "ec2:CreateAction": [
            "CreateVolume",
            "CreateSnapshot"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteTags"
      ],
      "Resource": [
        "arn:aws:ec2:${REGION}:*:volume/*",
        "arn:aws:ec2:${REGION}:*:snapshot/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestTag/CSIVolumeName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/CSIVolumeName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/kubernetes.io/created-for/pvc/name": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteSnapshot"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/CSIVolumeSnapshotName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteSnapshot"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    }
  ]
}
EOF

# 3. Check if role exists
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "🆕 Creating IAM role: $ROLE_NAME"
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "IAM role for EBS CSI Driver" \
        --region $REGION
    
    echo "📋 Attaching policy to role..."
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name EBS_CSI_Driver_Policy \
        --policy-document file:///tmp/ebs-csi-policy.json \
        --region $REGION
    
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    echo "✅ Created IAM role: $ROLE_ARN"
else
    echo "✅ IAM role already exists: $ROLE_ARN"
    echo "🔄 Updating trust policy..."
    aws iam update-assume-role-policy \
        --role-name $ROLE_NAME \
        --policy-document file:///tmp/trust-policy.json \
        --region $REGION
    
    echo "🔄 Updating policy..."
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name EBS_CSI_Driver_Policy \
        --policy-document file:///tmp/ebs-csi-policy.json \
        --region $REGION
fi

# 4. Update service account with IRSA annotation
echo "🔧 Updating service account with IRSA annotation..."
kubectl annotate serviceaccount $SERVICE_ACCOUNT_NAME \
    -n $SERVICE_ACCOUNT_NAMESPACE \
    eks.amazonaws.com/role-arn=$ROLE_ARN \
    --overwrite

echo "🔄 Restarting EBS CSI controller pods to pick up new credentials..."
kubectl rollout restart deployment ebs-csi-controller -n kube-system

echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod \
    -l app=ebs-csi-controller \
    -n kube-system \
    --timeout=120s

echo ""
echo "✅ Setup complete!"
echo "📋 Role ARN: $ROLE_ARN"
echo ""
echo "🔄 Now restarting stuck monitoring pods..."
kubectl delete pod -n apc-obsv-ns \
    -l app=grafana \
    -l app=loki \
    -l app=prometheus \
    -l app=tempo \
    --force --grace-period=0 2>/dev/null || true

echo ""
echo "✅ Done! Check pod status with:"
echo "   kubectl get pods -n apc-obsv-ns"
