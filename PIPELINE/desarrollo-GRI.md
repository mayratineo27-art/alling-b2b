---
titulo: "Plantilla reutilizable — Pipeline DevSecOps con Jenkins y herramientas SAST/SCA open-source"
proyecto: "Detección automatizada de vulnerabilidades en código fuente usando Jenkins y herramientas SAST/SCA open-source bajo un enfoque DevSecOps"
curso: "Gestión de Riesgos y Seguridad de TI"
version: 1.0
fecha: 2026-06
estado: borrador para reparto al equipo
audiencia: "Los 5 integrantes del equipo — cada uno aplica esta plantilla sobre su propio sistema"
regla_fundamental: "Esta plantilla NO se reescribe libremente. Las secciones marcadas como FIJO vienen del Capítulo III ya cerrado del informe y son comunes a los 5 sistemas. Las secciones marcadas como ADAPTAR son las que cada integrante ajusta a su propio repositorio."
---

# Plantilla reutilizable — Pipeline DevSecOps
## Guía de implementación, ejecución y reporte para el equipo

> Este documento es la guía operativa que traduce la metodología
> ya cerrada en el Capítulo III del informe ("Detección automatizada
> de vulnerabilidades en código fuente usando Jenkins y herramientas
> SAST/SCA open-source bajo un enfoque DevSecOps") en pasos ejecutables
> que cada integrante del equipo sigue sobre su propio sistema.

---

## Cómo usar este documento

Este documento tiene tres partes:

1. **Plan de implementación** — qué instalar, en qué orden, antes de tocar el código de tu sistema.
2. **Plan de ejecución** — cómo correr el pipeline sobre tu repositorio específico, paso a paso, con los puntos exactos donde debes adaptar algo.
3. **Guía de reporte (Capítulo IV)** — cómo documentar lo que obtuviste, con qué nivel de detalle, y cómo se conecta con la metodología del Capítulo III para que el informe final sea coherente entre las 5 secciones individuales.

**Regla de no invención:** ningún integrante modifica el criterio de severidad del security gate, ni el conjunto de herramientas, ni el orden de las etapas — eso ya está fijado por consenso del equipo en el Capítulo III. Lo único que se adapta por sistema son las rutas de código, el lenguaje de análisis, y la disponibilidad o no de un entorno de staging.

**Convención de marcado en este documento:**
- 🔒 **FIJO** — viene del Capítulo III, no se cambia.
- 🔧 **ADAPTAR** — cada integrante ajusta este punto a su propio sistema.
- 📋 **REPORTAR** — esto se documenta literalmente en la sección 4.X del Capítulo IV correspondiente a tu sistema.

---

## Referencia obligatoria — relación con la metodología del informe

Antes de ejecutar cualquier paso de este documento, recuerda que la arquitectura del pipeline, las herramientas y el criterio del security gate **ya están decididos y cerrados** en el Capítulo III del informe (apartados 3.2 a 3.5). Esta plantilla no es una metodología nueva — es la traducción operativa de esa metodología a comandos reales que cada uno ejecuta.

Si en algún punto de tu implementación sientes que necesitas una herramienta distinta, un criterio de severidad diferente, o una etapa adicional que no está aquí — **detente y consúltalo con el equipo antes de implementarlo por tu cuenta.** Un cambio metodológico individual rompe la comparabilidad de los 5 resultados en la sección 4.6 (comparativa global), que es uno de los puntos que la rúbrica evalúa con más rigor.

---
## 1. Plan de implementación

> Esta sección cubre lo que debes instalar y levantar **antes** de
> tocar el código de tu sistema. Se hace una sola vez por integrante.

### 1.1 Requisitos previos — verificación obligatoria antes de instalar nada

🔧 **ADAPTAR** — antes de levantar cualquier contenedor, verifica qué
puertos ya están ocupados en tu propia máquina. No asumas que los
puertos sugeridos están libres — pueden chocar con servicios que ya
tengas corriendo (bases de datos, otros proyectos, frontends en
desarrollo).

**Comando de verificación (Linux):**
```bash
ss -tulpn | grep LISTEN
```

**Comando de verificación (Windows, PowerShell):**
```powershell
Get-NetTCPConnection -State Listen | Select-Object LocalPort
```

**Comando de verificación (macOS):**
```bash
lsof -iTCP -sTCP:LISTEN -P
```

Si alguno de los puertos sugeridos en el apartado 1.2 ya está en uso
en tu máquina, ajusta el valor correspondiente en el archivo
`docker-compose-devsecops.yml` antes de continuar — la plantilla usa
puertos no estándar (8081, 50001, 9090, 5433) precisamente para
reducir la probabilidad de choque, pero cada entorno es distinto.

### 1.2 Infraestructura base — docker-compose

🔒 **FIJO** — esta es la infraestructura común a los 5 sistemas:
Jenkins como orquestador y SonarQube Community Edition como motor
de análisis estático principal. Se levanta una sola vez, de forma
independiente al docker-compose de tu propio proyecto.

Crea una carpeta separada de tu repositorio de trabajo, por ejemplo
`~/devsecops-infra/`, y coloca ahí el archivo `docker-compose-devsecops.yml`:

```yaml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    container_name: devsecops-jenkins
    user: root
    ports:
      - "8081:8080"
      - "50001:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
      # AJUSTAR: ruta a tu propio repositorio, modo solo lectura
      - /ruta/a/tu/repositorio:/workspace/tu-repositorio:ro
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=true
    networks:
      - devsecops-net
    restart: unless-stopped

  sonarqube:
    image: sonarqube:10-community
    container_name: devsecops-sonarqube
    ports:
      - "9090:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://sonarqube-db:5432/sonar
      - SONAR_JDBC_USERNAME=sonar
      - SONAR_JDBC_PASSWORD=${SONAR_DB_PASSWORD}
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    depends_on:
      - sonarqube-db
    networks:
      - devsecops-net
    restart: unless-stopped

  sonarqube-db:
    image: postgres:16
    container_name: devsecops-sonarqube-db
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_USER=sonar
      - POSTGRES_PASSWORD=${SONAR_DB_PASSWORD}
      - POSTGRES_DB=sonar
    volumes:
      - sonarqube_db_data:/var/lib/postgresql/data
    networks:
      - devsecops-net
    restart: unless-stopped

networks:
  devsecops-net:
    driver: bridge

volumes:
  jenkins_home:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  sonarqube_db_data:
```

🔧 **ADAPTAR** — crea un archivo `.env` en la misma carpeta, **nunca
dentro de tu repositorio de código**, con una clave propia:
```
SONAR_DB_PASSWORD=elige-tu-propia-clave-aqui
```
### 1.3 Levantar la infraestructura

```bash
cd ~/devsecops-infra/
docker compose -f docker-compose-devsecops.yml up -d
```

Verifica que los tres contenedores están corriendo:

```bash
docker compose -f docker-compose-devsecops.yml ps
```

📋 **REPORTAR** — esta es tu primera evidencia para la sección 4.X.2
("Configuración del pipeline aplicado"): una captura de este comando
mostrando los tres contenedores en estado `Up`, con descripción breve
de tu entorno (sistema operativo, versión de Docker).

### 1.4 Primer acceso — configuración inicial

**Jenkins** — accede a `http://localhost:8081`. La primera vez pedirá
una clave de desbloqueo, visible con:

```bash
docker exec devsecops-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Instala los plugins sugeridos por defecto, más estos tres adicionales
desde *Manage Jenkins → Plugins*:
- `SonarQube Scanner` (integración con SonarQube)
- `HTML Publisher` (para publicar reportes dentro de Jenkins)
- `Pipeline: Stage View` (visualización del flujo de etapas)

**SonarQube** — accede a `http://localhost:9090`. Usuario y clave por
defecto: `admin` / `admin` (te pedirá cambiarla al primer ingreso —
hazlo, no la dejes en default).

🔧 **ADAPTAR** — dentro de SonarQube, genera un token de análisis:
*My Account → Security → Generate Token*. Este token se usa en el
Jenkinsfile como variable `SONAR_TOKEN` — **nunca lo escribas
directamente en el Jenkinsfile ni en ningún archivo versionado**.
Configúralo en Jenkins como *Credential* (Manage Jenkins → Credentials
→ Add Credentials → Secret text).

### 1.5 Herramientas adicionales — verificación de imágenes Docker

🔒 **FIJO** — el pipeline usa estas herramientas como contenedores
Docker efímeros (se descargan automáticamente la primera vez que el
pipeline corre, no requieren instalación manual separada):

| Herramienta | Imagen Docker |
|---|---|
| Semgrep | `returntocorp/semgrep` |
| Trivy | `aquasec/trivy` |
| OWASP Dependency-Check | `owasp/dependency-check` |
| OWASP ZAP (condicional) | `zaproxy/zap-stable` |

No es necesario descargarlas manualmente — Jenkins las descarga la
primera vez que ejecuta cada etapa. Si quieres verificar que Docker
puede descargarlas antes de correr el pipeline completo (recomendado
para no descubrir un problema de red a mitad de ejecución):

```bash
docker pull returntocorp/semgrep
docker pull aquasec/trivy
docker pull owasp/dependency-check
docker pull zaproxy/zap-stable
```
---
## 2. Plan de ejecución

> Esta sección cubre cómo configurar Jenkins para que lea tu
> repositorio, cómo se ejecuta cada etapa del pipeline, y qué hacer
> con los resultados que obtienes en cada una.

### 2.1 El Jenkinsfile — estructura completa

🔒 **FIJO** — la secuencia de etapas, su orden, y el criterio de
bloqueo del security gate vienen del Capítulo III (apartados 3.2 a
3.5) y son comunes a los 5 sistemas. 🔧 **ADAPTAR** únicamente las
líneas marcadas explícitamente abajo.

Coloca este archivo con el nombre exacto `Jenkinsfile` en la raíz de
tu propio repositorio (o en una rama separada, ver apartado 2.6 de
este documento):

```groovy
pipeline {
    agent any

    environment {
        // 🔧 ADAPTAR — ruta al código fuente dentro del contenedor de Jenkins
        PROJECT_PATH = "/workspace/tu-repositorio"
        // 🔧 ADAPTAR — identificador único de tu proyecto en SonarQube
        PROJECT_KEY  = "nombre-de-tu-sistema"
        SONAR_HOST   = "http://devsecops-sonarqube:9000"
    }

    parameters {
        // No se elimina ni se renombra — ver apartado 2.5 de este documento
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
                sh """
                    docker run --rm \
                      -v ${PROJECT_PATH}:/usr/src \
                      -e SONAR_HOST_URL=${SONAR_HOST} \
                      -e SONAR_LOGIN=\${SONAR_TOKEN} \
                      sonarsource/sonar-scanner-cli \
                      -Dsonar.projectKey=${PROJECT_KEY} \
                      -Dsonar.sources=/usr/src/src
                """
                // 🔧 ADAPTAR — si tu proyecto no es Python, agrega el parámetro
                // de versión de lenguaje correspondiente, por ejemplo:
                // -Dsonar.javascript.environments=node  (para Node.js)
                // -Dsonar.java.binaries=target/classes   (para Java)
            }
        }

        stage('2b. SAST - Semgrep') {
            steps {
                sh """
                    docker run --rm \
                      -v ${PROJECT_PATH}:/src \
                      returntocorp/semgrep \
                      semgrep --config p/owasp-top-ten --config p/security-audit \
                      --json --output /src/semgrep-report.json /src/src
                """
            }
        }

        stage('3. SCA - Trivy') {
            steps {
                sh """
                    docker run --rm \
                      -v ${PROJECT_PATH}:/target \
                      aquasec/trivy fs --scanners vuln,secret \
                      --format json --output /target/trivy-report.json /target
                """
            }
        }

        stage('3b. SCA - Dependency-Check') {
            steps {
                sh """
                    docker run --rm \
                      -v ${PROJECT_PATH}:/src \
                      owasp/dependency-check \
                      --scan /src --format JSON --out /src/dependency-check-report
                """
            }
        }

        stage('4. Security Gate') {
            steps {
                script {
                    echo "Evaluando criterio de bloqueo — severidad alta o crítica"
                    // NOTA: este script es un placeholder funcional.
                    // La lógica real de evaluación —que aplica la Tabla 2 de
                    // mapeo de severidad del Capítulo III sobre los 4 reportes
                    // JSON generados arriba— se construye una vez que el
                    // equipo tiene reportes reales para validar su formato
                    // exacto. No reemplaces este placeholder por tu cuenta
                    // sin avisar al equipo, para que los 5 sistemas evalúen
                    // el gate con la misma lógica.
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
                // 🔧 ADAPTAR — nombre de imagen según tu propio sistema
                sh "docker build -t ${PROJECT_KEY}:test ${PROJECT_PATH}"
            }
        }

        stage('6. Deploy staging') {
            when {
                expression { return params.STAGING_DISPONIBLE == true }
            }
            steps {
                echo "Desplegando en entorno de staging"
                // 🔧 ADAPTAR — comando real de despliegue, específico de tu sistema
            }
        }

        stage('7. DAST - OWASP ZAP (condicional)') {
            when {
                expression { return params.STAGING_DISPONIBLE == true }
            }
            steps {
                // 🔧 ADAPTAR — STAGING_URL real de tu entorno desplegado
                sh """
                    docker run --rm \
                      -v ${PROJECT_PATH}:/zap/wrk \
                      zaproxy/zap-stable zap-full-scan.py \
                      -t \${STAGING_URL} -J zap-report.json
                """
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/*-report.json, **/semgrep-report.json', allowEmptyArchive: true
        }
        failure {
            echo "Pipeline detenido — revisar etapa fallida antes de reintentar"
        }
    }
}
```

### 2.2 Creación del Job en Jenkins

1. Desde el panel de Jenkins (`http://localhost:8081`), selecciona
   *New Item → Pipeline*.
2. 🔧 **ADAPTAR** — nombra el Job según tu propio sistema (ejemplo:
   `devsecops-tecnimotos`, `devsecops-sistema2`, etc.).
3. En *Pipeline → Definition*, selecciona *Pipeline script from SCM*
   si tu Jenkinsfile vive en tu repositorio Git, o *Pipeline script*
   si prefieres pegarlo directo (válido para esta primera corrida de
   prueba, aunque lo recomendado a futuro es versionarlo).
4. Guarda y selecciona *Build with Parameters* para tu primera
   ejecución — verás el checkbox `STAGING_DISPONIBLE` que definimos
   en el Jenkinsfile.

### 2.3 Primera corrida — qué esperar etapa por etapa

| Etapa | Qué hace | Qué revisar si falla |
|---|---|---|
| 1. Checkout | Verifica que el volumen montado es accesible | Ruta incorrecta en `PROJECT_PATH`, o el volumen no se montó en el docker-compose |
| 2. SAST SonarQube | Sube el análisis al dashboard de SonarQube | Token `SONAR_TOKEN` no configurado en Jenkins Credentials |
| 2b. SAST Semgrep | Genera `semgrep-report.json` | Falla de red al descargar la imagen la primera vez — reintentar |
| 3. SCA Trivy | Genera `trivy-report.json` | Igual que arriba, o ruta de proyecto vacía/incorrecta |
| 3b. SCA Dependency-Check | Genera carpeta `dependency-check-report` | Esta herramienta es la más lenta — puede tardar varios minutos en la primera corrida porque descarga la base NVD completa |
| 4. Security Gate | Bloquea o permite continuar | Si bloquea sin que esperaras un hallazgo crítico, revisa el reporte de Trivy directamente antes de asumir un error del pipeline |
| 5. Build de imagen | Construye la imagen Docker de tu sistema | Verifica que tu repositorio tiene un Dockerfile válido en la ruta esperada |
| 6-7. Deploy/DAST | Solo corren si marcaste `STAGING_DISPONIBLE` | — |

📋 **REPORTAR** — para cada etapa que complete con éxito (o que
bloquee, si ese es el resultado real), captura la vista de *Stage
View* de Jenkins mostrando el flujo completo. Esta es tu evidencia
principal para la sección 4.X.2 del Capítulo IV.

### 2.4 Revisión de resultados — dónde mirar cada reporte

| Herramienta | Dónde ver el resultado |
|---|---|
| SonarQube | Dashboard web en `http://localhost:9090`, proyecto con el nombre de tu `PROJECT_KEY` |
| Semgrep | Archivo `semgrep-report.json`, accesible desde *Build → Artifacts* en Jenkins |
| Trivy | Archivo `trivy-report.json`, mismo lugar |
| Dependency-Check | Carpeta `dependency-check-report/dependency-check-report.html` — este reporte sí tiene una vista HTML legible, ábrelo directo en el navegador |

### 2.5 Sobre el parámetro `STAGING_DISPONIBLE`

🔒 **FIJO** — este parámetro existe porque el Capítulo I (apartado 1.6)
ya declaró que no todos los sistemas del equipo cuentan necesariamente
con un entorno de staging desplegado, y el Capítulo III (Fase 7) hizo
de DAST una etapa condicional, no obligatoria.

Si tu sistema **no tiene staging desplegado**, simplemente deja el
parámetro en `false` (su valor por defecto) y continúa. Esto **no es
una falla de tu implementación** — es una limitación que debes
declarar de forma explícita en tu sección 4.X del Capítulo IV, citando
el apartado 1.6 del informe.

### 2.6 Sobre el control de versiones del Jenkinsfile

🔧 **ADAPTAR según tu propia decisión de equipo individual** — el
Jenkinsfile puede vivir en una rama separada de tu repositorio (por
ejemplo `devsecops-pipeline-local`) sin necesidad de hacer push a tu
remoto si tu repositorio es privado, o si prefieres no mezclar esta
infraestructura experimental con tu rama principal de trabajo. No es
obligatorio que el Jenkinsfile quede público en tu repositorio para
que el trabajo académico sea válido — lo que el informe necesita son
los resultados y las evidencias, no el archivo en sí expuesto.

---
## 3. Guía de reporte — Capítulo IV, sección 4.X de tu sistema

> Esta sección traduce los resultados que obtuviste en el Plan de
> ejecución hacia el formato exacto que pide la rúbrica del curso:
> evidencias claras, numeradas y bien analizadas. Sigue esta
> estructura de 9 bloques sin saltarte ninguno — incluso si un
> bloque se reporta como limitación (no aplica), debe aparecer
> explícitamente, nunca omitirse en silencio.

### 3.1 Estructura obligatoria de tu sección — los 9 bloques

🔒 **FIJO** — esta estructura es común a los 5 integrantes. Reemplaza
la "X" por el número de tu sistema (1 a 5) al título de cada bloque.

**Bloque 4.X.1 — Descripción breve del sistema**

📋 Incluye: nombre del sistema, stack tecnológico (lenguaje,
framework, base de datos), propósito de negocio en una o dos
oraciones, tamaño aproximado del código (número de módulos,
endpoints o equivalente, líneas de código si lo sabes).

*Extensión orientativa:* un párrafo, no más de media página.

**Bloque 4.X.2 — Configuración del pipeline aplicado**

📋 Incluye: cómo adaptaste el Jenkinsfile genérico a tu sistema —
qué rutas cambiaste, qué parámetro de lenguaje agregaste en
SonarQube (si tu sistema no es Python), cualquier ajuste que hiciste
sobre la plantilla del Tramo 3 de este documento. Captura del
docker-compose corriendo (los tres contenedores en estado `Up`).

**Bloque 4.X.3 — Evidencia: Etapa SAST**

📋 Mínimo dos capturas: una del dashboard de SonarQube mostrando los
hallazgos clasificados por severidad, y una del contenido relevante
de tu `semgrep-report.json` (puedes mostrar un fragmento legible, no
el JSON crudo completo). Cada captura lleva: número de figura
provisional (`[Fig. SX-N]`, según la convención que ya acordamos),
título descriptivo, y un párrafo de análisis debajo — nunca una
imagen sin comentario.

*Pregunta que tu análisis debe responder:* ¿qué tipo de hallazgo
predominó (vulnerabilidad, code smell, bug)? ¿Coincide con lo que
esperarías dado el lenguaje y la arquitectura de tu sistema?

**Bloque 4.X.4 — Evidencia: Etapa SCA y secretos**

📋 Mínimo dos capturas: el reporte HTML de Dependency-Check abierto en
el navegador, y el contenido relevante de tu `trivy-report.json`
(dependencias vulnerables y/o secretos detectados, si los hubo).

*Pregunta que tu análisis debe responder:* ¿las dos herramientas SCA
(Trivy y Dependency-Check) coincidieron en los mismos hallazgos, o
hubo diferencias? Esto es justamente el tipo de comparación
cuantificable que pide el brief original del curso.

**Bloque 4.X.5 — Evidencia: Security Gate**

📋 Una captura del *Stage View* de Jenkins mostrando si la etapa 4 se
detuvo (bloqueo) o continuó (paso exitoso). Si se bloqueó, incluye
también qué hallazgo específico causó el bloqueo.

**Bloque 4.X.6 — Evidencia: Build y despliegue**

📋 Captura de la construcción exitosa de la imagen Docker (etapa 5).
Si tu sistema tiene staging desplegado y completaste la etapa 6,
incluye también esa evidencia aquí.

**Bloque 4.X.7 — Evidencia: DAST (Fase 7) — condicional**

📋 Si marcaste `STAGING_DISPONIBLE = true` y ejecutaste OWASP ZAP,
incluye la captura del reporte. **Si no tienes staging disponible,
no omitas este bloque** — escribe explícitamente: *"Esta etapa no se
ejecutó en el presente sistema, conforme a la limitación declarada
en el apartado 1.6 del Capítulo I, por no contar con un entorno de
staging desplegado al momento de esta implementación."*

**Bloque 4.X.8 — Análisis de resultados propio**

📋 Aquí no van capturas — es texto de interpretación. Responde de
forma explícita:
- ¿Qué categorías de OWASP Top 10 o CWE se activaron con mayor
  frecuencia en tu sistema?
- ¿El nivel de hallazgos encontrado es consistente con la madurez de
  seguridad que tu sistema ya tenía antes de este análisis, o reveló
  algo que no esperabas?
- ¿Alguno de los hallazgos te parece un falso positivo? Justifica por
  qué lo consideras así, no lo descartes sin argumento.

*Extensión orientativa:* dos a tres párrafos, con cita en formato
APA7 si te apoyas en literatura (por ejemplo, OWASP, 2021) para
justificar por qué cierto hallazgo es relevante.

**Bloque 4.X.9 — Métricas cuantificables del sistema**

📋 Tabla resumen con formato APA7 (numerada en su propia secuencia de
tablas, título arriba, fuente "Elaboración propia" abajo):

| Métrica | Valor |
|---|---|
| Total de hallazgos (todas las herramientas) | |
| Hallazgos de severidad crítica | |
| Hallazgos de severidad alta | |
| Hallazgos de severidad media | |
| Hallazgos de severidad baja | |
| Secretos expuestos detectados | |
| Dependencias vulnerables detectadas | |
| ¿Pipeline bloqueado por security gate? | Sí / No |
| ¿DAST ejecutado? | Sí / No |

Esta tabla es la que tú envías al equipo para construir la
comparativa global del apartado 4.6 — sin esta tabla completa de tu
parte, la comparativa no puede armarse.

### 3.2 Fecha límite de entrega de tu tabla del bloque 4.X.9

🔧 **ADAPTAR según el cronograma real del equipo** — esta tabla debe
llegar a quien consolide el apartado 4.6 antes de la fecha que el
equipo defina en conjunto. Sin las 5 tablas completas, la sección
comparativa global no puede redactarse a tiempo.

---
## 4. Subsección comparativa global — apartado 4.6 del Capítulo IV

> Esta parte la consolida una sola persona del equipo (normalmente
> quien lidera la integración del informe), a partir de las 5 tablas
> del bloque 4.X.9 que cada integrante entrega. No se redacta hasta
> tener las 5 tablas completas — redactarla antes, con datos
> incompletos, obliga a reescribirla después.

### 4.1 Tabla comparativa consolidada

🔒 **FIJO** — esta es la estructura de la tabla que el brief original
del curso exige explícitamente (porcentaje de vulnerabilidades
detectadas, errores por severidad, secretos expuestos, dependencias
inseguras). Se construye combinando las 5 tablas individuales del
bloque 4.X.9:

| Sistema | Stack | Total hallazgos | Crítica | Alta | Media | Baja | Secretos | Dependencias vulnerables | Gate bloqueado | DAST ejecutado |
|---|---|---|---|---|---|---|---|---|---|---|
| Sistema 1 — Tecnimotos Santi | | | | | | | | | | |
| Sistema 2 | | | | | | | | | | |
| Sistema 3 | | | | | | | | | | |
| Sistema 4 | | | | | | | | | | |
| Sistema 5 | | | | | | | | | | |

*Nota.* Tabla numerada según la secuencia correlativa real del
documento consolidado final — no antes. Fuente: elaboración propia a
partir de las secciones 4.1.9 a 4.5.9 del presente informe.

### 4.2 Qué debe responder el análisis de esta tabla

El análisis comparativo no es solo presentar la tabla — debe
responder, con datos de la propia tabla como sustento, estas
preguntas (que son, en esencia, los tres objetivos específicos del
Capítulo I aplicados ahora con evidencia real):

1. ¿Qué porcentaje de los hallazgos totales del equipo correspondió a
   severidad alta o crítica? ¿Esa proporción varió mucho entre
   sistemas con stacks distintos (por ejemplo, Python vs JavaScript),
   o fue consistente?
2. ¿Cuántos de los 5 sistemas tuvieron su pipeline bloqueado por el
   security gate? Si la mayoría no se bloqueó, ¿eso significa que el
   código analizado ya tenía buena higiene de seguridad, o que el
   umbral del gate (severidad alta/crítica únicamente, según el
   apartado 3.5 del Capítulo III) fue demasiado permisivo para este
   conjunto de sistemas?
3. ¿En cuántos sistemas se pudo ejecutar la Fase 7 (DAST)? Esto
   alimenta directamente la discusión de la limitación declarada en
   el apartado 1.6 del Capítulo I — ¿fue una limitación aislada de un
   solo sistema, o un patrón general del equipo?

### 4.3 Conexión obligatoria hacia el Capítulo V

🔒 **FIJO** — el análisis de este apartado 4.6 es la base directa
sobre la que se redactan las conclusiones por objetivo específico del
Capítulo V (apartado 5.1). No se redacta el Capítulo V sin haber
cerrado primero este apartado 4.6 — el orden de cierre del informe es:
4.X individuales → 4.6 comparativa → Capítulo V.

---

## 5. Checklist final de verificación — antes de entregar tu sección

🔒 **FIJO** — verifica esto antes de avisar al equipo que tu sección
4.X está lista para integrarse al documento consolidado:
``` 
□ Los 9 bloques de la sección 3.1 de este documento están presentes  
— incluso los que reportan una limitación (no se omitió ninguno)  
□ Cada figura tiene numeración provisional [Fig. SX-N], título  
descriptivo, y un párrafo de análisis debajo — ninguna imagen  
aparece sin comentario  
□ La tabla del bloque 4.X.9 está completa, sin celdas vacías  
□ El bloque 4.X.8 (análisis propio) tiene al menos una cita en  
formato APA7 si hace referencia a un estándar (OWASP, CWE, etc.)  
□ Si tu sistema no tuvo staging disponible, el bloque 4.X.7 declara  
esto explícitamente citando el apartado 1.6 del Capítulo I —  
no quedó vacío ni fue eliminado de la sección  
□ No modificaste el criterio de severidad del security gate (apartado  
3.5 del Capítulo III) ni agregaste herramientas fuera de las  
acordadas en la Tabla 1 del Capítulo III, sin avisar primero al  
equipo  
□ Entregaste tu tabla del bloque 4.X.9 a quien consolida el  
apartado 4.6, antes de la fecha límite acordada
```
---

## 6. Historial de este documento

| Versión | Fecha   | Cambio                                                                                                                                                    |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-06 | Primera versión completa — plan de implementación, ejecución y guía de reporte, construida en conjunto con el desarrollo del Capítulo I y III del informe |