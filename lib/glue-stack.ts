import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { CfnJob, CfnWorkflow } from "aws-cdk-lib/aws-glue";
import { CfnCrawler, CfnDatabase } from "aws-cdk-lib/aws-glue";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnPermissions } from "aws-cdk-lib/aws-lakeformation";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { BucketDeployment,Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import path = require("path");
import { Database } from '@aws-cdk/aws-glue-alpha';


export class GlueStack extends Stack{
    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id, props);
        const accountId = Stack.of(this).account;
        const scriptBucket = new Bucket(this, 'script-bucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            bucketName: 'script-bucket-5491',
        });

        // const scriptAsset = new Asset(this, 'script-asset', {
        //     path: path.join(__dirname,'./assets/sample-job.py'),
        // });
        new BucketDeployment(this, 'GlueScriptsDeployment', {
            sources: [Source.asset('./assets')],
            destinationBucket: scriptBucket,
          });

         // Glue Database
        const glueDatabase = new CfnDatabase(this, 'GlueDatabase', {
            catalogId: accountId,
            databaseInput: {
                name: 'sample-database-5491',
                description: 'Database to store test data for 5491.',
            },
            });

        const testdb = new Database(this, 'testdb', {
            databaseName: 'sa-test',
        });

        const role = new Role(this, 'glue-role', {
            assumedBy: new ServicePrincipal('glue.amazonaws.com'),
            roleName: 'glue-role-5491',
            managedPolicies:[
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
            ]
            });

        // LakeFormation Permissions
        const lakeformation= new CfnPermissions(this, 'LakeFormationPermissions', {
            dataLakePrincipal: {
            dataLakePrincipalIdentifier: role.roleArn,
            },
            resource: {
            databaseResource: {
                catalogId: glueDatabase.catalogId,
                name: 'sample-database-5491',
            },
            },
            permissions: ['ALL'],
        });
        lakeformation.addDependency(glueDatabase);

        // Glue Crawler    

        const rawCrawler = new CfnCrawler(this, 'raw-crawler', {
            role: role.roleArn,
            databaseName: 'sample-database-5491',
            name: 'raw-crawler-5491',
            targets: {
                s3Targets: [
                    {
                        path: 's3://raw-landing-5491/',
                    }]
            },
            recrawlPolicy: {
                recrawlBehavior: 'CRAWL_EVERYTHING',
              },
        });

         // Glue Job
        const glueJob = new CfnJob(this, 'GlueJob', {
            name: 'glue-job-5491',
            command: {
            name: 'pythonshell',
            pythonVersion: '3.9',
            scriptLocation: `s3://${scriptBucket.bucketName}/sampe-job-5491.py`,
            },
            role: role.roleArn,
            glueVersion: '3.0',
            timeout: 3,
        });

        // Glue Workflow
        const glueWorkflow = new CfnWorkflow(this, 'GlueWorkflow', {
            name: 'glue-workflow-5491',
            description: 'Workflow to process the coffee data.',
        });


        
    }
}