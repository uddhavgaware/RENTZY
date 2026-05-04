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
# Use shell form to allow environment variable expansion and set memory limits
ENTRYPOINT ["sh", "-c", "java -Xmx300m -Xms200m Dspring.profiles.active=prod -jar app.jar"]
