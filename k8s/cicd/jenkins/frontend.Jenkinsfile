pipeline {
    agent any

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
            // [수정] 스킵 방지를 위해 params 체크만 수행 (첫 빌드 성공 보장)
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
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    
                    // [중복 체크] 이미 Harbor에 같은 버전이 있는지 확인
                    withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def harborCheck = sh(
                            script: "curl -s -u '${USER}:${PASS}' -I 'http://${HARBOR_URL}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts/${env.FULL_VERSION}' | grep 'HTTP/1.1 200' || true",
                            returnStdout: true
                        ).trim()
                        
                        if (harborCheck.contains("200")) {
                            env.IMAGE_EXISTS = "true"
                            echo "✅ [SKIP] 동일 버전(${env.FULL_VERSION})이 Harbor에 이미 존재합니다."
                        } else {
                            env.IMAGE_EXISTS = "false"
                        }
                    }

                    sh '''
                        if ! command -v trivy &> /dev/null; then
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp
                        fi
                    '''
                }
            }
        }

        stage('2. Security & Analysis') {
            // 이미지가 없고 + 프론트엔드 폴더 수정 시에만 실행
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
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=alphacar-frontend -Dsonar.sources=."
                        }
                        // [보안] package.json 15.5.9 적용 시 여기서 취약점 0개 달성
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                    }
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            when { 
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    changeset "dev/alphacar/frontend/**"
                }
            }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
                        // BUILDKIT 캐시 사용하여 첫 빌드 이후 속도 향상
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
            // 매니페스트는 이미지 존재 여부와 상관없이 '수정 시' 최신화
            when { changeset "dev/alphacar/frontend/**" }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM', 
                            branches: [[name: 'main']], 
                            userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                        ])

                        sh """
                            # 파일 경로 자동 검색 (sed 오류 방지)
                            TARGET_FILE=\$(find . -name "frontend.yaml" | grep "k8s/frontend" | head -n 1)
                            
                            if [ -n "\$TARGET_FILE" ]; then
                                sed -i "s|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" \$TARGET_FILE
                                git config user.email "jenkins@alphacar.com"
                                git config user.name "Jenkins-CI"
                                git add .
                                if [ -n "\$(git status --porcelain)" ]; then
                                    git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                                    git push origin main
                                fi
                            else
                                echo "❌ frontend.yaml을 찾을 수 없습니다."
                                exit 1
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
