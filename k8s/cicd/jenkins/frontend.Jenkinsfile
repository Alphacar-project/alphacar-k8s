pipeline {
    agent any

    // 플러그인 에러 방지를 위해 순정 트리거 사용
    triggers {
        githubPush()
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
            // 프론트엔드 소스 폴더 변경 시 또는 수동 빌드 시 실행
            when {
                anyOf {
                    changeset "dev/alphacar/frontend/**"
                    buildingTag()
                }
            }
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
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    
                    sh '''
                        if ! command -v trivy &> /dev/null; then
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp
                        fi
                    '''
                }
            }
        }

        stage('2. Security & Analysis') {
            when { changeset "dev/alphacar/frontend/**" }
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    dir('dev/alphacar/frontend') {
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=alphacar-frontend -Dsonar.analysis.cache=true -Dsonar.sources=."
                        }
                        // [보안] CRITICAL 2개 해결 확인 (Next.js 15.5.9 패치 필요)
                        echo "🛡️ Trivy 보안 스캔 중..."
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                    }
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            when { changeset "dev/alphacar/frontend/**" }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
                        // BUILDKIT 캐시로 빌드 시간 단축
                        sh "docker build --build-arg BUILDKIT_INLINE_CACHE=1 -f Dockerfile -t ${imageFullTag} ."
                        withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                            sh "echo '${PASS}' | docker login ${HARBOR_URL} -u ${USER} --password-stdin"
                            sh "docker push ${imageFullTag}"
                        }
                    }
                }
            }
        }

        stage('4. Update Manifest') {
            when { changeset "dev/alphacar/frontend/**" }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM', branches: [[name: 'main']], userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]])
                        sh "sed -i 's|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|' k8s/frontend/frontend.yaml"
                        sh """
                            git config user.email "jenkins@alphacar.com"
                            git config user.name "Jenkins-CI"
                            git add .
                            if [ -n "\$(git status --porcelain)" ]; then
                                git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                                git push origin main
                            fi
                        """
                    }
                }
            }
        }
    }
}
