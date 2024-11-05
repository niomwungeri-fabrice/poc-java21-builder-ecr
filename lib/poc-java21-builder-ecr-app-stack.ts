import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import { Duration } from 'aws-cdk-lib';

export class PocJava21BuilderEcrAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, stageName: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // use default
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true, // Look up the default VPC
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'FargateCluster', {
      vpc,
    });

    // Build Docker image from the `code` directory
    const dockerImage = new ecrAssets.DockerImageAsset(this, 'SpringBootDockerImage', {
      directory: './code', // Reference the 'code' directory for the Dockerfile
    });

    // Define Fargate service with an Application Load Balancer
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster,
      desiredCount: 1,
      cpu: 256,
      memoryLimitMiB: 512,
      publicLoadBalancer: true, 
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
        containerPort: 8080,
        environment: {
          'JAVA_OPTS': '-Xms512m -Xmx512m',
          "stageName": stageName
        }
      },
    });

    // Configure health check on the /actuator endpoint
    fargateService.targetGroup.configureHealthCheck({
      path: '/actuator',
      interval: Duration.seconds(30),
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer for accessing the Spring Boot actuator endpoint',
    });
  }
}
