pipeline {
    agent any

    triggers {
        githubPush()
    }

    parameters {
        choice(name: 'ACTION', choices: ['build_and_deploy', 'skip_build'], description: '실행 여부')
    }

    environment {
        HARBOR_URL      = '192.168.0.170:30000'
        HARBOR_PROJECT  = 'alphacar'
        IMAGE_NAME      = 'frontend'
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
                    env.FULL_VERSION = "${baseVer}.${currentBuild.number}-${env.GIT_SHA}"
                    
                    // [중복 체크] Harbor에 이미지가 있으면 IMAGE_EXISTS를 true로 설정
                    withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        def harborCheck = sh(
                            script: "curl -s -u '${USER}:${PASS}' -I 'http://${HARBOR_URL}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts/${env.FULL_VERSION}' | grep 'HTTP/1.1 200' || true",
                            returnStdout: true
                        ).trim()
                        env.IMAGE_EXISTS = harborCheck.contains("200") ? "true" : "false"
                    }

                    sh 'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp'
                }
            }
        }

        stage('2. Security & Analysis') {
            // 이미지가 없을 때만 실행
            when { expression { env.IMAGE_EXISTS == "false" && params.ACTION == 'build_and_deploy' } }
            steps {
                dir('dev/alphacar/frontend') {
                    sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            // 이미지가 없을 때만 실행
            when { expression { env.IMAGE_EXISTS == "false" && params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
                        sh "docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t ${imageFullTag} ."
                        withCredentials([usernamePassword(credentialsId: HARBOR_CRED_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                            sh "echo '${PASS}' | docker login ${HARBOR_URL} -u ${USER} --password-stdin"
                            sh "docker push ${imageFullTag}"
                        }
                    }
                }
            }
        }

        stage('4. Update Manifest') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                dir('manifest-update') {
                    // 1. 매니페스트 레포지토리 체크아웃
                    checkout([$class: 'GitSCM', 
                        branches: [[name: 'main']], 
                        userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                    ])
                    
                    // 2. 파일 찾기 및 수정 로직 강화
                    sh """
                        # 현재 폴더에서 frontend.yaml 파일의 실제 위치를 찾습니다.
                        TARGET_FILE=\$(find . -type f -name "frontend.yaml" | head -n 1)
                        
                        if [ -z "\$TARGET_FILE" ]; then
                            echo "❌ 에러: 레포지토리 내에서 frontend.yaml 파일을 찾을 수 없습니다."
                            ls -R
                            exit 1
                        fi
                        
                        echo "📝 수정할 파일: \$TARGET_FILE"
                        
                        # 이미지 태그 업데이트
                        sed -i "s|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" "\$TARGET_FILE"
                        
                        # Git Push
                        git config user.email "jenkins@alphacar.com"
                        git config user.name "Jenkins-CI"
                        git add .
                        if [ -n "\$(git status --porcelain)" ]; then
                            git commit -m "Update frontend image to ${env.FULL_VERSION} [skip ci]"
                            git push origin main
                            echo "✅ 매니페스트 업데이트 완료"
                        else
                            echo "ℹ️ 변경 사항이 없습니다."
                        fi
                    """
                }
            }
        }
    }
}
