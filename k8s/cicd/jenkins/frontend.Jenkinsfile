pipeline {
    agent any

    // [자동화] GitHub Push 신호를 받으면 자동으로 빌드를 시작합니다.
    triggers {
        githubPush()
    }

    parameters {
        choice(name: 'ACTION', choices: ['build_and_deploy', 'skip_build'], description: '실행 여부')
    }

    environment {
        HARBOR_URL      = '192.168.0.170:30000'
        HARBOR_PROJECT  = 'alphacar'
        IMAGE_NAME      = 'frontend' // 최종 이미지 이름: frontend
        HARBOR_CRED_ID  = 'harbor-cred'
        GIT_CREDENTIAL_ID = 'github-cred'
        SONARQUBE_NAME = 'SonarQube'
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
                    // 최종 버전 형식: 1.0.50-e336570
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    echo "📦 생성된 버전: ${env.FULL_VERSION}"

                    // [중복 체크] Harbor 이미지 존재 여부 확인
                    withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def harborCheck = sh(
                            script: "curl -s -u '${USER}:${PASS}' -I 'http://${HARBOR_URL}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts/${env.FULL_VERSION}' | grep 'HTTP/1.1 200' || true",
                            returnStdout: true
                        ).trim()
                        env.IMAGE_EXISTS = harborCheck.contains("200") ? "true" : "false"
                    }

                    if (env.IMAGE_EXISTS == "true") {
                        echo "✅ [SKIP] 동일 버전이 Harbor에 이미 존재합니다."
                    }

                    sh 'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp'
                }
            }
        }

        stage('2. Security & Analysis') {
            // 이미지가 없고 + 배포 액션일 때만 실행
            when { 
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    expression { params.ACTION == 'build_and_deploy' }
                }
            }
            steps {
                dir('dev/alphacar/frontend') {
                    echo "🛡️ Trivy 보안 스캔 시작 (취약점 0개 목표)..."
                    // package.json 15.5.9 적용 시 취약점 0개 달성 가능
                    sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            when { 
                allOf {
                    expression { env.IMAGE_EXISTS == "false" }
                    expression { params.ACTION == 'build_and_deploy' }
                }
            }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    echo "🐳 도커 이미지 빌드: ${imageFullTag}"
                    dir('dev/alphacar/frontend') {
                        sh "docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t ${imageFullTag} ."
                        withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                            sh "echo '${PASS}' | docker login ${HARBOR_URL} -u ${USER} --password-stdin"
                            sh "docker push ${imageFullTag}"
                            sh "docker logout ${HARBOR_URL}"
                        }
                    }
                }
            }
        }

        stage('4. Update Manifest') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                dir('manifest-update') {
                    checkout([$class: 'GitSCM',
                        branches: [[name: 'main']],
                        userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                    ])

                    sh """
                        # 1. 파일 찾기: frontend-deployment-multimaster.yaml 우선 검색
                        TARGET_FILE=\$(find k8s/frontend -name "*deployment*.yaml" | head -n 1)

                        if [ -z "\$TARGET_FILE" ]; then
                            echo "❌ 에러: 업데이트할 YAML 파일을 찾을 수 없습니다."
                            ls -R k8s/frontend
                            exit 1
                        fi

                        echo "📝 수정 대상 파일: \$TARGET_FILE"
                        echo "🚀 적용할 새 이미지 주소: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"

                        # 2. 이미지 태그 업데이트 (이미지 이름이 alphacar-frontend여도 강제 교체)
                        # image: 라인 전체를 새 Harbor 주소로 갈아끼웁니다.
                        sed -i "s|image: .*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" "\$TARGET_FILE"

                        # 3. 변경 사항 로그 출력 (확인용)
                        grep "image:" "\$TARGET_FILE"

                        # 4. Git 설정 및 푸시
                        git config user.email "jenkins@alphacar.com"
                        git config user.name "Jenkins-CI"
                        git add .
                        if [ -n "\$(git status --porcelain)" ]; then
                            git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                            git push origin main
                            echo "✅ 매니페스트 업데이트 완료 및 Push 성공"
                        else
                            echo "ℹ️ 이미 최신 버전이 적용되어 있습니다."
                        fi
                    """
                }
            }
        }
    }

    post {
        always {
            // 빌드 후 미사용 이미지 정리
            sh "docker image prune -f"
            cleanWs()
        }
    }
}
