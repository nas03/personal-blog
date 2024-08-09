#!/bin/bash

parametersName=("NODE_ENV" "PORT" "JWT_SECRET" "JWT_ACCESS_EXP" "JWT_REFRESH_EXP" "REFRESH_COOKIE_NAME" "REDIS_DEFAULT_TTL" "REDIS_CLOUD_PASSWORD" "REDIS_CLOUD_HOST" "REDIS_CLOUD_PORT" "CONFIG_AWS_REGION" "CONFIG_AWS_SECRET_KEY_ID" "CONFIG_AWS_ACCESS_KEY_ID" "EC2_AWS_USERNAME" "EC2_AWS_ENDPOINT" "EC2_AWS_PORT" "EC2_AWS_KEY_PAIR" "RDS_AWS_ENDPOINT" "RDS_AWS_PORT" "RDS_AWS_USERNAME" "RDS_AWS_PASSWORD" "RDS_AWS_DB_NAME" "S3_AWS_BUCKET")

for envParameter in ${parametersName[@]}; do
    envParameterValue=$(echo $(aws ssm get-parameter --name $envParameter --output json) | jq -r '.Parameter.Value')
    echo "$envParameter=$envParameterValue" >>.env
done