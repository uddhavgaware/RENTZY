# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
# If building from repo root, cd to backend. Otherwise build in current dir. Place jar at /app/app.jar
RUN if [ -f "backend/pom.xml" ]; then \
      cd backend && mvn clean package -DskipTests && cp target/*.jar /app/app.jar; \
    else \
      mvn clean package -DskipTests && cp target/*.jar /app/app.jar; \
    fi

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080

# This specifically activates application-prod.properties when run in Docker!
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:MaxMetaspaceSize=144m", "-XX:+UseSerialGC", "-XX:+UseContainerSupport", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
