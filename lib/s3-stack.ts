import * as cdk from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';


export class S3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const rawLanding = new Bucket(this, 'raw-landing', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: 'raw-landing-5491',
      autoDeleteObjects: true,
    });

    const publishedLanding = new Bucket(this, 'published-landing', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: 'published-landing-5491',
      autoDeleteObjects: true,
    });
  }
}
