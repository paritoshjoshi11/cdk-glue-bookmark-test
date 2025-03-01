import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

# Get job arguments
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'DATABASE_NAME', 'TABLE_NAME', 'OUTPUT_BUCKET'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read data from Glue Data Catalog
datasource = glueContext.create_dynamic_frame.from_catalog(
    database=args['DATABASE_NAME'],
    table_name=args['TABLE_NAME'],
    transformation_ctx="datasource_landing"
)

# Convert DynamicFrame to DataFrame
dataframe = datasource.toDF()

# Print data to console
dataframe.show()

# Write data to new S3 bucket
output_path = f"s3://{args['OUTPUT_BUCKET']}/op/"
dataframe.write.mode("append").parquet(output_path)

# Commit job
job.commit()