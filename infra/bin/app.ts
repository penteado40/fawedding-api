import * as cdk from 'aws-cdk-lib'
import { FaweddingStack } from '../lib/fawedding-stack'

const app = new cdk.App()

new FaweddingStack(app, 'FaweddingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
})
