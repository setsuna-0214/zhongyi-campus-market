# syntax=docker/dockerfile:1.7
# 阶段1: 构建
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -Dmaven.test.skip=true dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -Dmaven.test.skip=true clean package

# 阶段2: 运行
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# 设置时区
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
