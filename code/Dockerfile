FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-al2023-jdk

# Copy the JAR file from the builder stage
COPY --from=builder /app/target/app.jar /app/app.jar

# Set the working directory
WORKDIR /app

# Set the entry point to run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
