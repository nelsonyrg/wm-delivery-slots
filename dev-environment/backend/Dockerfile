# ============================================================
# STAGE 1: Desarrollo (con Spring Boot DevTools / hot reload)
# ============================================================
FROM eclipse-temurin:25-jdk AS development

WORKDIR /app

# Instalar Maven
RUN apt-get update && \
    apt-get install -y maven curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias primero (cache de Docker)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Exponer puertos (app + debug)
EXPOSE 8080 5005

# Ejecutar con spring-boot:run para hot reload
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]

# ============================================================
# STAGE 2: Build de producción
# ============================================================
FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================================
# STAGE 3: Runtime de producción (JRE mínimo)
# ============================================================
FROM eclipse-temurin:25-jre AS production

WORKDIR /app

# Crear usuario no-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar JAR desde stage de build
COPY --from=build /app/target/*.jar app.jar

# Cambiar a usuario no-root
USER appuser

EXPOSE 8080

# Opciones de JVM optimizadas para contenedores
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:InitialRAMPercentage=50.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
