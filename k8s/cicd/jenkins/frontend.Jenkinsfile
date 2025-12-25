pipeline {
    agent any

    triggers {
        // 플러그인이 정상 인식되도록 소문자로 시작하는 genericTrigger 사용 권장
        genericTrigger(
            genericVariables: [
                [key: 'changedFiles', value: '$.commits[*].modified[*]']
            ],
            causeString: 'Frontend build triggered by GitHub Push',
            token: 'frontend-token',
            tokenCredentialId: '',
            printPostContent: true,
            printContributedVariables: true,
            regexpFilterText: '$changedFiles',
            regexpFilterExpression: '.*dev/alphacar/frontend/.*'
        )
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
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner'
                    dir('dev/alphacar/frontend') {
                        withSonarQubeEnv("${env.SONARQUBE_NAME}") {
                            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=alphacar-frontend -Dsonar.analysis.cache=true -Dsonar.sources=."
                        }
                        // Trivy 검사 (보안 0개를 목표로 진행)
                        sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                    }
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
                        // BUILDKIT 캐시 사용하여 빌드 시간 단축
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
            steps {
                script {
                    dir('manifest-update') {
                        checkout([$class: 'GitSCM', 
                            branches: [[name: 'main']], 
                            userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]
                        ])
                        
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
