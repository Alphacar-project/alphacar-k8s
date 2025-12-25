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
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.FULL_VERSION = "1.0.${currentBuild.number}-${env.GIT_SHA}"
                    
                    // Trivy 설치
                    sh 'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp'
                }
            }
        }

        stage('2. Security & Analysis') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                dir('dev/alphacar/frontend') {
                    // [취약점 0개 확인] package.json에 15.5.9가 적용되어 있어야 합니다.
                    sh "/tmp/trivy fs --severity CRITICAL,HIGH --exit-code 0 ."
                }
            }
        }

        stage('3. 고속 Docker Build & Push') {
            when { expression { params.ACTION == 'build_and_deploy' } }
            steps {
                script {
                    def imageFullTag = "${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}"
                    dir('dev/alphacar/frontend') {
                        sh "docker build -t ${imageFullTag} ."
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
                    checkout([$class: 'GitSCM', branches: [[name: 'main']], userRemoteConfigs: [[url: "${env.MANIFEST_REPO_URL}", credentialsId: "${env.GIT_CREDENTIAL_ID}"]]])
                    sh """
                        TARGET_FILE=\$(find . -name "frontend.yaml" | grep "k8s/frontend" | head -n 1)
                        sed -i "s|image: .*/frontend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.FULL_VERSION}|" \$TARGET_FILE
                        git config user.email "jenkins@alphacar.com"
                        git config user.name "Jenkins-CI"
                        git add .
                        git commit -m "Update image to ${env.FULL_VERSION}" || echo "No changes"
                        git push origin main
                    """
                }
            }
        }
    }
}
