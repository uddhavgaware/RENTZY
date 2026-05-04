# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Adding memory limits to stay within Render's 512MB free tier
ENTRYPOINT ["java", "-Xmx384m", "-Xms384m", "-jar", "app.jar"]
