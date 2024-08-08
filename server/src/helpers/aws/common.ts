const awsConfig = {
  region: process.env.CONFIG_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CONFIG_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CONFIG_AWS_SECRET_KEY_ID,
  },
} as const;

const parametersName: string[] = [
  // # -- LOCAL SECRET BEGIN --
  "NODE_ENV",
  "PORT",
  // # -- LOCAL SECRET END --

  // # -- JWT SECRET BEGIN --
  "JWT_SECRET",
  "JWT_ACCESS_EXP",
  "JWT_REFRESH_EXP",
  "REFRESH_COOKIE_NAME",
  // # -- JWT SECRET END --

  // # -- REDIS SECRET BEGIN --
  "REDIS_DEFAULT_TTL",
  "REDIS_CLOUD_PASSWORD",
  "REDIS_CLOUD_HOST",
  "REDIS_CLOUD_PORT",
  // # -- REDIS SECRET END --

  // # -- AWS SECRET BEGIN --
  // # CREDENTIALS
  "CONFIG_AWS_REGION",
  "CONFIG_AWS_SECRET_KEY_ID",
  "CONFIG_AWS_ACCESS_KEY_ID",
  // # EC2
  "EC2_AWS_USERNAME",
  "EC2_AWS_ENDPOINT",
  "EC2_AWS_PORT",
  "EC2_AWS_KEY_PAIR",
  // # RDS
  "RDS_AWS_ENDPOINT",
  "RDS_AWS_PORT",
  "RDS_AWS_USERNAME",
  "RDS_AWS_PASSWORD",
  "RDS_AWS_DB_NAME",
  // # S3
  "S3_AWS_BUCKET",
  // # -- AWS SECRET END --
] as const;

const awsCommon = {
  parametersName,
  awsConfig,
};

export default awsCommon