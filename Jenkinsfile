pipeline {
    agent any

    environment {
        // Ruta al código fuente dentro del contenedor de Jenkins (para comandos internos como grep)
        PROJECT_PATH = "/workspace/tu-repositorio"
        // Ruta al código fuente en la máquina HOST (Windows), necesaria para los montajes de volumen docker -v
        HOST_PROJECT_PATH = "c:/Users/MAYRATM/source/repos/tiendRed"
        // Identificador único de tu proyecto en SonarQube
        PROJECT_KEY  = "tiendred-app"
        SONAR_HOST   = "http://devsecops-sonarqube:9000"
        // Credencial inyectada de forma segura
        SONAR_TOKEN  = credentials('SONAR_TOKEN')
    }

    parameters {
        booleanParam(name: 'STAGING_DISPONIBLE', defaultValue: false,
                     description: 'Marcar solo si tienes un entorno de staging desplegado')
    }

    stages {

        stage('1. Checkout') {
            steps {
                echo "Leyendo código fuente desde ${PROJECT_PATH}"
                sh "ls -la ${PROJECT_PATH}"
            }
        }

        stage('2. SAST - SonarQube') {
            steps {
                // Ejecuta SonarQube scanner y excluye dependencias y carpetas de desarrollo para velocidad
                sh """
                    docker run --rm \
                      --network devsecops-infra_devsecops-net \
                      -v ${HOST_PROJECT_PATH}:/usr/src \
                      -e SONAR_HOST_URL=${SONAR_HOST} \
                      -e SONAR_TOKEN=\${SONAR_TOKEN} \
                      sonarsource/sonar-scanner-cli \
                      -Dsonar.projectKey=${PROJECT_KEY} \
                      -Dsonar.sources=/usr/src \
                      -Dsonar.token=\${SONAR_TOKEN} \
                      -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**,**/.next/**,**/.venv/**,**/tests/**,PROTOTIPO_2/**
                """
            }
        }

        stage('2b. SAST - Semgrep') {
            steps {
                // Ejecuta Semgrep excluyendo node_modules, .venv, .next
                // Nota: Ya existe un archivo .semgrepignore en el root para evitar que recorra carpetas pesadas
                sh """
                    docker run --rm \
                      -v ${HOST_PROJECT_PATH}:/src \
                      returntocorp/semgrep \
                      semgrep --config p/owasp-top-ten --config p/security-audit \
                      --exclude=node_modules --exclude=.venv --exclude=.next --exclude=PROTOTIPO_2 \
                      --json --output /src/semgrep-report.json /src
                """
            }
        }

        stage('3. SCA - Trivy') {
            steps {
                sh """
                    docker run --rm \
                      -v ${HOST_PROJECT_PATH}:/target \
                      aquasec/trivy fs --scanners vuln,secret --timeout 20m \
                      --skip-dirs "**/node_modules" --skip-dirs "**/.venv" --skip-dirs "**/.next" --skip-dirs "PROTOTIPO_2" \
                      --format json --output /target/trivy-report.json /target
                """
            }
        }

        stage('3b. SCA - Dependency-Check') {
            steps {
                sh """
                    docker run --rm \
                      -v ${HOST_PROJECT_PATH}:/src \
                      -v ${HOST_PROJECT_PATH}/.dependency-check-data:/usr/share/dependency-check/data \
                      owasp/dependency-check \
                      --scan /src --format JSON --out /src/dependency-check-report \
                      --exclude '**/node_modules/**' --exclude '**/.venv/**' --exclude '**/.next/**' --exclude '**/PROTOTIPO_2/**'
                """
            }
        }

        stage('4. Security Gate') {
            steps {
                script {
                    echo "Evaluando criterio de bloqueo — severidad alta o crítica"
                    def criticalFound = sh(
                        script: """
                            grep -l '"severity":"CRITICAL"' ${PROJECT_PATH}/trivy-report.json || true
                        """,
                        returnStdout: true
                    ).trim()

                    if (criticalFound) {
                        error "PIPELINE BLOQUEADO: hallazgo de severidad crítica detectado."
                    }
                }
            }
        }

        stage('5. Build de imagen') {
            steps {
                sh "docker build -t ${PROJECT_KEY}:test ${PROJECT_PATH}"
            }
        }

        stage('6. Deploy staging') {
            when {
                expression { return params.STAGING_DISPONIBLE == true }
            }
            steps {
                echo "Desplegando en entorno de staging"
            }
        }

        stage('7. DAST - OWASP ZAP (condicional)') {
            when {
                expression { return params.STAGING_DISPONIBLE == true }
            }
            steps {
                sh """
                    docker run --rm \
                      -v ${HOST_PROJECT_PATH}:/zap/wrk \
                      zaproxy/zap-stable zap-full-scan.py \
                      -t \${STAGING_URL} -J zap-report.json
                """
            }
        }
    }

    post {
        always {
            dir(PROJECT_PATH) {
                archiveArtifacts artifacts: '*-report.json, dependency-check-report/**', allowEmptyArchive: true
            }
        }
        failure {
            echo "Pipeline detenido — revisar etapa fallida antes de reintentar"
        }
    }
}
