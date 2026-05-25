import * as path from 'path'
import * as cdk from 'aws-cdk-lib'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as ses from 'aws-cdk-lib/aws-ses'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export class FaweddingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Dead Letter Queue — mensagens com falha após 3 tentativas
    const dlq = new sqs.Queue(this, 'RsvpEmailDlq', {
      queueName: 'fawedding-rsvp-email-dlq',
      retentionPeriod: cdk.Duration.days(14),
    })

    // Fila principal
    const queue = new sqs.Queue(this, 'RsvpEmailQueue', {
      queueName: 'fawedding-rsvp-email',
      visibilityTimeout: cdk.Duration.seconds(180), // 6x o timeout do Lambda
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    })

    // Identidade de domínio no SES — gera registros DNS para o Cloudflare
    new ses.EmailIdentity(this, 'FaweddingDomain', {
      identity: ses.Identity.domain('fawedding.com.br'),
    })

    // Lambda handler
    const emailHandler = new lambdaNodejs.NodejsFunction(this, 'RsvpEmailHandler', {
      functionName: 'fawedding-rsvp-email-handler',
      entry: path.join(__dirname, '../../lambda/src/handler.ts'),
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      environment: {
        FROM_EMAIL: 'noreply@fawedding.com.br',
      },
      bundling: {
        sourceMap: true,
        minify: false,
      },
    })

    // IAM: Lambda pode enviar emails via SES
    emailHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    )

    // Trigger: SQS → Lambda
    emailHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      }),
    )

    // Outputs
    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      description: 'SQS_QUEUE_URL — adicionar como variável de ambiente no Render',
    })

    new cdk.CfnOutput(this, 'DlqUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL — inspecionar mensagens com falha',
    })
  }
}
