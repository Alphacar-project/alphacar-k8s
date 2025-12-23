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
                    // 실제 소스 위치인 dev/alphacar/frontend 내부의 version.txt 참조
                    def versionPath = 'dev/alphacar/frontend/version.txt'
                    try {
                        if (fileExists(versionPath)) {
                            baseVer = readFile(versionPath).trim()
                        }
                    } catch (e) {
                        echo "⚠️ version.txt 읽기 실패 → 1.0 사용"
                    }
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    echo "📦 빌드 버전: ${env.FULL_VERSION}"
                }
            }
        }

        stage('2. SonarQube Analysis') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    // 소나큐브 분석 대상 경로 수정
                    dir('dev/alphacar/frontend') {
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=alphacar-frontend \
                                -Dsonar.projectName=alphacar-frontend \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=${env.SONAR_HOST_URL} \
                                -Dsonar.sourceEncoding=UTF-8 \
                                -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/out/**,**/*.test.js,**/*.spec.js \
                                -Dsonar.scanner.timeout=300
                            """
                        }
                    }
                }
            }
        }

        stage('3. Docker Build & Push') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    def imageLatestTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:latest"

                    echo "🐳 이미지 빌드 시작 (경로 수정 완료)..."
                    
                    // [핵심 수정] Dockerfile이 있는 실제 경로로 진입
                    dir('dev/alphacar/frontend') {
                        sh "docker build -f Dockerfile -t ${imageFullTag} -t ${imageLatestTag} ."

                        withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                            sh """
                                echo "${PASS}" | docker login ${HARBOR_URL} -u ${USER} --password-stdin
                                docker push ${imageFullTag}
                                docker push ${imageLatestTag}
                                docker logout ${HARBOR_URL}
                            """
                        }
                    }
                }
            }
        }

        stage('4. Update Manifest (GitOps)') {
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
                                echo "📝 Manifest 업데이트 중..."
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
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
