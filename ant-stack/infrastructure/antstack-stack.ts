import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class AntStackStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'AntStackVPC', {
            maxAzs: 2,
            natGateways: 1,
        });

        const redisSubnetGroup = new ec2.SubnetGroup(this, 'RedisSubnet', {
            vpc,
            description: 'Redis subnet group',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const database = new rds.DatabaseInstance(this, 'Database', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15,
            }),
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T4G,
                ec2.InstanceSize.MICRO
            ),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            allocatedStorage: 20,
            databaseName: 'antstack',
            credentials: rds.Credentials.fromGeneratedSecret('postgres'),
            backupRetention: cdk.Duration.days(7),
        });

        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
            memoryLimitMiB: 512,
            cpu: 256,
        });

        const container = taskDefinition.addContainer('AntStackServer', {
            image: ecs.ContainerImage.fromRegistry('antstack/server:latest'),
            portMappings: [{ containerPort: 8080 }],
            environment: {
                PORT: '8080',
                NODE_ENV: 'production',
                REDIS_URL: 'redis://localhost:6379',
                DATABASE_URL: `postgresql://${database.secret?.secretValueFromJson('username')}:${database.secret?.secretValueFromJson('password')}@${database.instanceEndpoint.hostname}:5432/antstack`,
            },
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'antstack',
                logRetention: cdk.Duration.days(7),
            }),
        });

        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
            vpc,
            internetFacing: true,
        });

        const listener = lb.addListener('Listener', {
            port: 443,
            certificates: [acm.Certificate.fromCertificateArn(this, 'Cert', 'arn:aws:acm:us-east-1:123456789012:certificate/...')],
        });

        const service = new ecs.FargateService(this, 'Service', {
            cluster,
            taskDefinition,
            desiredCount: 2,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        });

        listener.addTargets('Targets', {
            port: 8080,
            targets: [service],
            healthCheck: {
                path: '/api/health',
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(10),
            },
        });

        new cdk.CfnOutput(this, 'LoadBalancerURL', {
            value: lb.loadBalancerDnsName,
        });
    }
}
