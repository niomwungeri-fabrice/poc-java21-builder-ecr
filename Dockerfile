FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-al2023-jdk

# Install Node.js
RUN curl -sL https://rpm.nodesource.com/setup_18.x | bash - && \
    yum install -y nodejs && \
    yum clean all

# Install Maven
RUN yum install -y maven && \
    yum clean all

# Verify installations
RUN java -version && node -v && npm -v && mvn -v
