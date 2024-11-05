# Use Amazon Corretto 21 JDK as the base image
FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-al2023-jdk

# Set the working directory
WORKDIR /app

# Copy the pre-built JAR file into the container with mvn clean package from the pipeline
COPY target/app.jar /app/app.jar

# Set the entry point to run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
