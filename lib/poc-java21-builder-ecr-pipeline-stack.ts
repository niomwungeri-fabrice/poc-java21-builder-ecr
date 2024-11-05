import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, CodeBuildStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { MyPipelineStage } from './stage';

export class PocJava21BuilderEcrPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create an ECR repository    
    const ecrRepository = new ecr.Repository(this, 'MyEcrRepository', { repositoryName: 'java21-builder-ecr', removalPolicy: cdk.RemovalPolicy.DESTROY, });
    // Reference the created ECR repository with the custom Java environment image    
    const ecrRepositoryArn = `arn:aws:ecr:${props?.env?.region}:${props?.env?.account}:repository/${ecrRepository.repositoryName}`;


    // Output the repository details
    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: ecrRepository.repositoryName,
      description: 'The name of the ECR repository',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryArn', {
      value: ecrRepository.repositoryArn,
      description: 'The ARN of the ECR repository',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'The URI of the ECR repository',
    });

    // Step 2: Define CodeBuild project to build and push Docker image to ECR    
    const buildProject = new codebuild.Project(this, 'MyBuildProject', {
      projectName: 'my-build-project',
      buildSpec: codebuild.BuildSpec.fromAsset('./buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
        privileged: true, // Required for Docker builds
      },
      environmentVariables: {
        'AWS_DEFAULT_REGION': { value: this.region },
        'AWS_ACCOUNT_ID': { value: this.account },
        'IMAGE_REPO_NAME': { value: ecrRepository.repositoryName },
        'IMAGE_TAG': { value: 'latest' },
      },
    });

    // add permission
    ecrRepository.grantPullPush(buildProject)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'TestPipeline',
      dockerEnabledForSelfMutation: true,
      assetPublishingCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId("aws/codebuild/standard:5.0"),
          privileged: true, // Enable privileged mode to run Docker commands
        },
      },
      synth: new CodeBuildStep('Synth', {
        // Use local directory `./code` as the input source
        input: CodePipelineSource.gitHub("niomwungeri-fabrice/poc-java21-builder-ecr", "main"),
        commands: ['npm i', 'npm ci', 'npm run build_staging', 'npx cdk synth'],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.fromEcrRepository(ecrRepository, 'latest'), // Custom ECR image with required Java setup
          privileged: true, // Required for Docker commands in case they are needed
        },
        // Add permissions to access ECR
        rolePolicy: [
          new iam.PolicyStatement({
            actions: [
              "ecr:GetAuthorizationToken",         // To get authorization token for ECR
              "ecr:BatchCheckLayerAvailability",   // To check if image layers are available
              "ecr:GetDownloadUrlForLayer"         // To download image layers
            ],
            resources: [ecrRepositoryArn],
          }),
        ],
      },
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
