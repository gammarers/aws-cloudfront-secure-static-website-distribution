import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudFrontSecureStaticWebsiteDistribution } from '../src';

describe('CustomResource Testing', () => {

  const app = new App();
  const stack = new Stack(app, 'TestingStack', {
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });

  const originBucket = new s3.Bucket(stack, 'StaticWebsiteOriginBucket', {
    encryption: s3.BucketEncryption.S3_MANAGED,
    versioned: false,
  });

  const certificate = new acm.Certificate(stack, 'StaticWebsiteCertificate', {
    domainName: 'static.example.com',
    // validation: acm.CertificateValidation.fromDns(hostedZone),
  });

  const distribution = new CloudFrontSecureStaticWebsiteDistribution(stack, 'CloudFrontSecureStaticWebsiteDistribution', {
    customDomain: 'static.example.com',
    customDomainCertificate: certificate,
    originBucket: originBucket,
  });

  const template = Template.fromStack(stack);

  it('Is GitLab Self Managed Connectrion Host CustomResource', () => {
    expect(distribution).toBeInstanceOf(cloudfront.Distribution);
  });

  it('Should match snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

});
