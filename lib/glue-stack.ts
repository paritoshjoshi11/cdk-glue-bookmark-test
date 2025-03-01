import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { CfnJob, CfnTrigger, CfnWorkflow } from "aws-cdk-lib/aws-glue";
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
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
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


        const pubCrawler = new CfnCrawler(this, 'pub-crawler', {
            role: role.roleArn,
            databaseName: 'sample-database-5491',
            name: 'pub-crawler-5491',
            targets: {
                s3Targets: [
                    {
                        path: 's3://published-landing-5491/',
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
            name: 'glueetl',
            pythonVersion: '3',
            scriptLocation: `s3://${scriptBucket.bucketName}/sampe-job-5491.py`,
            },
            role: role.roleArn,
            glueVersion: '4.0',
            numberOfWorkers: 2,
            workerType: 'G.1X',
            timeout: 3,
            defaultArguments: {
                '--job-bookmark-option': 'job-bookmark-enable',
                '--DATABASE_NAME': 'sample-database-5491',
                '--TABLE_NAME': 'raw_landing_5491', // Replace with your actual table name
                '--OUTPUT_BUCKET':'s3://published-landing-5491/'
            },
        });

        // Glue Workflow
        const glueWorkflow = new CfnWorkflow(this, 'GlueWorkflow', {
            name: 'glue-workflow-5491',
            description: 'Workflow to process the coffee data.',
        });
        // test workflow
        const testWorkflow = new CfnWorkflow(this, 'TestWorkflow', {
            name: 'test-workflow-111',
            description: 'Workflow to process the coffee data.',
        });

        // Glue Crawler trigger
        new CfnTrigger(this, 'raw-crawler-trigger', {
            type: 'ON_DEMAND',
            name: 'raw-crawler-trigger-5491',
            actions: [
                {
                    crawlerName: rawCrawler.name,
                },
            ],
            startOnCreation: false,
            workflowName: glueWorkflow.name,
        });

        // Glue Job trigger
        new CfnTrigger(this, 'glue-job-trigger', {
            type: 'CONDITIONAL',
            name: 'glue-job-trigger-5491',
            actions: [
                {
                    jobName: glueJob.name,
                },
            ],
            startOnCreation: true,
            workflowName: glueWorkflow.name,
            predicate: {
                conditions: [
                    {
                        crawlerName: rawCrawler.name,
                        logicalOperator: 'EQUALS',
                        crawlState: 'SUCCEEDED',
                    },
                ],
            },
        });
        // test trigger
        const trigger = new CfnTrigger(this, 'test-crawler-trigger-111', {
            type: 'SCHEDULED',
            schedule: 'cron(5 0 * * ? *)',
            name: 'test-crawler-trigger-111',
            actions: [
                {
                    crawlerName: rawCrawler.name,
                },
            ],
            startOnCreation: true,
            workflowName: testWorkflow.name,
        });
        //Ensure trigger depends on the crawler and workflow
        trigger.addDependency(rawCrawler);
        trigger.addDependency(testWorkflow);

        
    }
}