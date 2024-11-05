FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-al2023-jdk

# Install Node.js
RUN curl -sL https://rpm.nodesource.com/setup_18.x | bash - && \
    yum install -y nodejs && \
    yum clean all

# Install Maven
RUN yum install -y maven && \
    yum clean all

# Install Docker (DinD not recommended)
RUN yum install -y docker && \
    yum clean all

# Verify installations
RUN java -version && node -v && npm -v && mvn -v && docker -v

# Optional: Start Docker daemon if needed
CMD ["sh", "-c", "dockerd & while sleep 1000; do :; done"]

