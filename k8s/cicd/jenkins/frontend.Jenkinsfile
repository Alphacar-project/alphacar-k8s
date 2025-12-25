pipeline {
    agent any

    // GitHub Push 이벤트를 감지하여 자동으로 빌드를 트리거합니다.
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
        GIT_CREDENTIAL_ID = 'github-cred' // 젠킨스 Credentials에 등록된 ID

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

                    // [버전 관리] 1.0.빌드번호-GIT해시 형식
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    echo "📦 빌드 버전: ${env.FULL_VERSION}"

                    // [중복 체크] Harbor에 이미지가 이미 있는지 확인하여 빌드 시간 단축
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
                        // SonarQube 분석 (타임아웃을 10분으로 늘려 안정성 확보)
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
                        // Trivy 보안 스캔 리포트 생성
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
                        // Alpine 환경의 SWC 호환성을 위해 기본 빌더 사용
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

                        // [핵심] 인증 정보를 쉘 환경으로 가져와서 사용합니다.
                        withCredentials([usernamePassword(credentialsId: env.GIT_CREDENTIAL_ID, usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                            sh """
                                TARGET_FILE="k8s/frontend/frontend-deployment-multimaster.yaml"

                                if [ -f "\$TARGET_FILE" ]; then
                                    echo "📝 Manifest 업데이트 중: \$TARGET_FILE"
                                    # 기존 이미지 주소와 태그를 새 버전으로 치환
                                    sed -i "s|image: .*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" "\$TARGET_FILE"

                                    git config user.email "jenkins@alphacar.com"
                                    git config user.name "Jenkins-CI"
                                    git add .

                                    if [ -n "\$(git status --porcelain)" ]; then
                                        git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"

                                        # [인증 해결] 토큰을 사용하여 원격 레포지토리에 푸시합니다.
                                        git push https://\${GH_TOKEN}@github.com/Alphacar-project/alphacar-k8s.git HEAD:main

                                        echo "✅ GitOps 레포지토리 푸시 성공"
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
    }

    post {
        always {
            // 보안 스캔 결과물을 젠킨스 대시보드에서 볼 수 있게 아카이빙합니다.
            archiveArtifacts artifacts: 'dev/alphacar/frontend/trivy_report.txt', allowEmptyArchive: true
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
