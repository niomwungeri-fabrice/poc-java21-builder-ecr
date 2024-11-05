import { Construct } from "constructs"
import * as cdk from 'aws-cdk-lib';
import { PocJava21BuilderEcrAppStack } from "./poc-java21-builder-ecr-app-stack";

export class MyPipelineStage extends cdk.Stage {
  constructor(scope: Construct, stageName: string, props?: cdk.StageProps) {
    super(scope, stageName, props)
    new PocJava21BuilderEcrAppStack(this, 'PocJava21BuilderEcrAppStack', stageName)
  }
}