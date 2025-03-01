#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { GlueStack } from '../lib/glue-stack';

const app = new cdk.App();
const s3stack =new S3Stack(app, 'S3Stack', {});

const gluestack = new GlueStack(app, 'GlueStack', {});
gluestack.node.addDependency(s3stack);