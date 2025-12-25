pipeline {
    agent any

    // [개선] Generic Webhook Trigger를 사용하여 프론트엔드 폴더 변경 시에만 빌드 수행
    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'changedFiles', value: '$.commits[*].modified[*]']
            ],
            regexpFilterText: '$changedFiles',
            regexpFilterExpression: '.*dev/alphacar/frontend/.*',
            token: 'frontend-token' // GitHub Webhook URL 끝에 ?token=frontend-token 을 붙여주세요
        )
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
                    if (fileExists(versionPath)) {
                        baseVer = readFile(versionPath).trim()
                    }
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    // 1.0.x 형식으로 버전 고정
                    env.FULL_VERSION = "${baseVer}${currentBuild.number}-${env.GIT_SHA}"
                    
                    sh '''
                        if ! command -v trivy &> /dev/null; then
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
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=alphacar-frontend -Dsonar.analysis.cache=true -Dsonar.sources=."
                        }
                        echo "🛡️ Trivy 보안 스캔 중..."
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                    }
                }
            }
        }

        stage('3. Docker Build & Push') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
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
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM', branches: [[name: 'main']], userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]])
                        sh "sed -i 's|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|' k8s/frontend/frontend.yaml"
                        withCredentials([usernamePassword(credentialsId: "${env.GIT_CREDENTIAL_ID}", usernameVariable: 'GU', passwordVariable: 'GP')]) {
                            sh "git config user.email 'jenkins@alphacar.com' && git config user.name 'Jenkins-CI'"
                            sh "git add . && git commit -m 'Update frontend to ${env.FULL_VERSION} [skip ci]' && git push origin main"
                        }
                    }
                }
            }
        }
    }
}
