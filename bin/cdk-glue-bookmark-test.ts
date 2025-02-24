#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { GlueStack } from '../lib/glue-stack';

const app = new cdk.App();
new S3Stack(app, 'S3Stack', {});

new GlueStack(app, 'GlueStack', {});