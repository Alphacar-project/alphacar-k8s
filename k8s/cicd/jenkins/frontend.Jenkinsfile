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

                    // [버전 관리] 1.0.buildNumber-GIT_SHA 형식
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    echo "📦 빌드 버전: ${env.FULL_VERSION}"

                    // [중복 체크] Harbor에 동일 버전이 이미 있는지 확인
                    withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def harborCheck = sh(
                            script: "curl -s -u '${USER}:${PASS}' -I 'http://${HARBOR_URL}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts/${env.FULL_VERSION}' | grep 'HTTP/1.1 200' || true",
                            returnStdout: true
                        ).trim()
                        env.IMAGE_EXISTS = harborCheck.contains("200") ? "true" : "false"
                    }
                }
            }
        }

        stage('2. Security & Quality Analysis') {
            when {
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    expression { params.ACTION == 'build_and_deploy' }
                }
            }
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    dir('dev/alphacar/frontend') {
                        // 2-1. SonarQube 분석 (타임아웃 및 메모리 최적화)
                        withEnv(["SONAR_SCANNER_OPTS=-Xmx1024m"]) {
                            withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \
                                    -Dsonar.projectKey=alphacar-frontend \
                                    -Dsonar.sources=. \
                                    -Dsonar.host.url=${env.SONAR_HOST_URL} \
                                    -Dsonar.ws.timeout=600
                                """
                            }
                        }

                        // 2-2. Trivy 보안 스캔
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --format table --output trivy_report.txt ."
                    }
                }
            }
        }

        stage('3. Docker Build & Push') {
            when {
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    expression { params.ACTION == 'build_and_deploy' }
                }
            }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    echo "🐳 도커 빌드 시작: ${imageFullTag}"

                    dir('dev/alphacar/frontend') {
                        // [에러 해결] Buildx 부재로 인한 에러 방지를 위해 BuildKit 옵션 제거
                        sh "docker build -f Dockerfile -t ${imageFullTag} ."

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
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM',
                            branches: [[name: 'main']],
                            userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                        ])

                        // [핵심 수정] 배포 파일 하나만 정확히 지정하여 이미지 업데이트
                        sh """
                            TARGET_FILE="k8s/frontend/frontend-deployment-multimaster.yaml"

                            if [ -f "\$TARGET_FILE" ]; then
                                echo "📝 Manifest 업데이트 중: \$TARGET_FILE"
                                # image: 라인 전체를 새 Harbor 주소로 교체 (패턴 유연성 확보)
                                sed -i "s|image: .*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" "\$TARGET_FILE"

                                git config user.email "jenkins@alphacar.com"
                                git config user.name "Jenkins-CI"
                                git add .
                                if [ -n "\$(git status --porcelain)" ]; then
                                    git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                                    git push origin main
                                    echo "✅ GitOps 레포지토리 푸시 완료"
                                else
                                    echo "ℹ️ 변경 사항이 없습니다."
                                fi
                            else
                                echo "❌ 에러: \$TARGET_FILE 파일을 찾을 수 없습니다."
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
            archiveArtifacts artifacts: 'dev/alphacar/frontend/trivy_report.txt', allowEmptyArchive: true
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
