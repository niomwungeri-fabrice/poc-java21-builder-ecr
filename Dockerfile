FROM public.ecr.aws/amazoncorretto/amazoncorretto:21-al2023-jdk

RUN curl -sL https://rpm.nodesource.com/setup_18.x | bash - && \
    yum install -y nodejs && \
    yum clean all

RUN java -version && node -v && npm -v