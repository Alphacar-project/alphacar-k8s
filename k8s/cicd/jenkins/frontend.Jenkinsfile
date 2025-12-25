pipeline {
    agent any

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
                    if (fileExists(versionPath)) {
                        baseVer = readFile(versionPath).trim()
                    }
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.FULL_VERSION = "${baseVer}${currentBuild.number}-${env.GIT_SHA}"
                    
                    // [신규] Trivy 설치 체크 및 환경 구성
                    sh '''
                        if ! command -v trivy &> /dev/null; then
                            echo "📦 Trivy 설치 진행..."
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp
                        fi
                    '''
                }
            }
        }

        stage('2. Security & Analysis') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    dir('dev/alphacar/frontend') {
                        // 2-1. SonarQube 최적화 (캐시 활성화 및 증분 분석 유도)
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=alphacar-frontend \
                                -Dsonar.projectName=alphacar-frontend \
                                -Dsonar.sources=. \
                                -Dsonar.analysis.cache=true \
                                -Dsonar.scm.provider=git \
                                -Dsonar.host.url=${env.SONAR_HOST_URL} \
                                -Dsonar.sourceEncoding=UTF-8 \
                                -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/out/**,**/*.test.js,**/*.spec.js
                            """
                        }

                        // 2-2. [신규] Trivy 보안 스캔 추가
                        echo "🛡️ 프론트엔드 취약점 스캔 중..."
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 . || echo '스캔 실패'"
                    }
                }
            }
        }

        stage('3. 고속 빌드 & 푸시') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    echo "🐳 도커 캐시를 활용한 빌드 시작..."

                    dir('dev/alphacar/frontend') {
                        // [최적화] --pull=false와 기존 캐시를 활용하여 빌드 속도 향상
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

        stage('4. Update Manifest') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM',
                            branches: [[name: 'main']],
                            userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                        ])

                        def yamlPath = "k8s/frontend/frontend.yaml"
                        sh """
                            if [ -f "${yamlPath}" ]; then
                                sed -i 's|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|' ${yamlPath}
                                git config user.email "jenkins@alphacar.com"
                                git config user.name "Jenkins-CI"
                                git add .
                                if [ -n "\$(git status --porcelain)" ]; then
                                    git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                                    git push origin main
                                fi
                            fi
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // 미사용 이미지만 정리하고 캐시는 최대한 보존
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
