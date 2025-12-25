pipeline {
    agent any

    // [자동화] GitHub Push 신호를 받으면 자동으로 빌드를 시작합니다.
    triggers {
        githubPush()
    }

    parameters {
        choice(name: 'ACTION',
               choices: ['build_and_deploy', 'skip_build'],
               description: '프론트엔드 빌드 및 배포를 진행하시겠습니까?')
        string(name: 'VERSION', defaultValue: '1.0', description: '기본 버전')
    }

    environment {
        HARBOR_URL      = '192.168.0.170:30000'
        HARBOR_PROJECT  = 'alphacar'
        IMAGE_NAME      = 'frontend'
        HARBOR_CRED_ID  = 'harbor-cred'
        GIT_CREDENTIAL_ID = 'github-cred'

        SONARQUBE_NAME = 'SonarQube'
        SONAR_HOST_URL = 'http://192.168.0.170:32000'

        MANIFEST_REPO_URL = 'https://github.com/Alphacar-project/alphacar-k8s.git'
    }

    stages {
        stage('1. Prepare') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                cleanWs()
                checkout scm
                script {
                    def baseVer = "1.0"
                    def versionPath = 'dev/alphacar/frontend/version.txt'
                    try {
                        if (fileExists(versionPath)) {
                            baseVer = readFile(versionPath).trim()
                        }
                    } catch (e) {
                        echo "⚠️ version.txt 읽기 실패 → 1.0 사용"
                    }
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()

                    // [버전 관리] 형식: 1.0.45-a763b75
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    echo "📦 빌드 버전: ${env.FULL_VERSION}"

                    // [중복 체크] Harbor에 이미 이 버전의 이미지가 있는지 확인
                    withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def harborCheck = sh(
                            script: "curl -s -u '${USER}:${PASS}' -I 'http://${HARBOR_URL}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts/${env.FULL_VERSION}' | grep 'HTTP/1.1 200' || true",
                            returnStdout: true
                        ).trim()
                        
                        if (harborCheck.contains("200")) {
                            env.IMAGE_EXISTS = "true"
                            echo "✅ [SKIP] 이미 동일한 버전의 이미지가 Harbor에 존재합니다."
                        } else {
                            env.IMAGE_EXISTS = "false"
                        }
                    }

                    // [보안] Trivy 설치 확인
                    sh '''
                        if ! command -v trivy &> /dev/null; then
                            echo "📦 Trivy 설치 진행..."
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp
                        fi
                    '''
                }
            }
        }

        stage('2. Security & Quality Analysis') {
            // 이미지가 없고, 프론트엔드 폴더에 변경이 있을 때만 실행
            when { 
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    changeset "dev/alphacar/frontend/**"
                }
            }
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    dir('dev/alphacar/frontend') {
                        // 2-1. SonarQube 분석
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=alphacar-frontend \
                                -Dsonar.projectName=alphacar-frontend \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=${env.SONAR_HOST_URL} \
                                -Dsonar.exclusions=**/node_modules/**,**/.next/**
                            """
                        }

                        // 2-2. Trivy 보안 스캔 (취약점 0개 목표)
                        echo "🛡️ 프론트엔드 소스 코드 취약점 스캔 중..."
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                    }
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            // 이미지가 없고, 프론트엔드 폴더에 변경이 있을 때만 실행
            when { 
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    changeset "dev/alphacar/frontend/**"
                }
            }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    echo "🐳 도커 캐시를 활용하여 빌드 시작..."

                    dir('dev/alphacar/frontend') {
                        sh "docker build --build-arg BUILDKIT_INLINE_CACHE=1 -f Dockerfile -t ${imageFullTag} ."

                        withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                            sh """
                                echo "${PASS}" | docker login ${HARBOR_URL} -u ${USER} --password-stdin
                                docker push ${imageFullTag}
                                docker logout ${HARBOR_URL}
                            """
                        }
                    }
                }
            }
        }

        stage('4. Update Manifest (GitOps)') {
            // 변경 사항이 있을 때만 실행
            when { changeset "dev/alphacar/frontend/**" }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM',
                            branches: [[name: 'main']],
                            userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                        ])

                        sh """
                            # 파일 경로를 찾아서 업데이트 (경로 오류 방지)
                            TARGET_FILE=\$(find . -name "frontend.yaml" | grep "k8s/frontend" | head -n 1)

                            if [ -n "\$TARGET_FILE" ] && [ -f "\$TARGET_FILE" ]; then
                                echo "📝 매니페스트 업데이트 중: \$TARGET_FILE"
                                sed -i "s|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" \$TARGET_FILE

                                git config user.email "jenkins@alphacar.com"
                                git config user.name "Jenkins-CI"
                                git add .
                                if [ -n "\$(git status --porcelain)" ]; then
                                    git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                                    git push origin main
                                else
                                    echo "✅ 변경 사항 없음."
                                fi
                            else
                                echo "❌ 에러: k8s/frontend/frontend.yaml 파일을 찾을 수 없습니다."
                                exit 2
                            fi
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
