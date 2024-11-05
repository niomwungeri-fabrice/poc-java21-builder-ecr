import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, CodeBuildStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { MyPipelineStage } from './stage';

export class PocJava21BuilderEcrPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference the existing ECR repository with the custom Java environment image
    const ecrRepository = ecr.Repository.fromRepositoryArn(this, 'CustomJavaImage', `arn:aws:ecr:${props?.env?.region}:${props?.env?.account}:repository/java21-builder-ecr`);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'TestPipeline',
      synth: new CodeBuildStep('Synth', {
        // Use local directory `./code` as the input source
        input: CodePipelineSource.gitHub("niomwungeri-fabrice/poc-java21-builder-ecr", "main"),
        commands: [
          'mvn clean install -DskipTests', // Build the Java Spring Boot application
          'npx cdk synth'                  // Synthesize the CDK application
        ],
        // Use the custom ECR image as the build environment
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.fromEcrRepository(ecrRepository), // Custom ECR image with required Java setup
          privileged: true, // Required for Docker commands in case they are needed
        },
      }),
    });

    // Add the testing stage
    const testingStage = pipeline.addStage(new MyPipelineStage(this, "uat", {
      env: { account: '354918376149', region: 'ca-central-1' },
    }));

    // Add manual approval before production
    testingStage.addPost(new ManualApprovalStep("Manual approval before production"));

    // Add the production stage
    pipeline.addStage(new MyPipelineStage(this, "prod", {
      env: { account: '354918376149', region: 'ca-central-1' },
    }));
  }
}
