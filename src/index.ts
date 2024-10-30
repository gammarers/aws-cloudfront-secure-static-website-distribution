import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CloudFrontSecureStaticWebsiteDistributionProps {
  readonly comment?: string;
  readonly customDomain: string;
  readonly customDomainCertificate: acm.ICertificate;
  readonly originBucket: s3.IBucket;
  readonly priceClass?: cloudfront.PriceClass;
  readonly loggingBucket?: s3.IBucket;
}

export class CloudFrontSecureStaticWebsiteDistribution extends cloudfront.Distribution {

  constructor(scope: Construct, id: string, props: CloudFrontSecureStaticWebsiteDistributionProps) {

    // 👇 Create random 8 length string
    const random: string = crypto.createHash('shake256', { outputLength: 4 })
      .update(`${cdk.Names.uniqueId(scope)}.${props.customDomain}`)
      .digest('hex');

    super(scope, id, {
      enabled: true,
      comment: props.comment ?? 'Static Website distribution',
      defaultRootObject: 'index.html',
      certificate: props.customDomainCertificate,
      domainNames: [
        props.customDomain,
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      // webAclId: props.wafAclId,
      enableLogging: !!props.loggingBucket,
      logBucket: props.loggingBucket,
      logFilePrefix: props.customDomain + '/original-log/',
      defaultBehavior: {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: origins.S3BucketOrigin.withOriginAccessControl(props.originBucket, {
          originAccessControl: new cloudfront.S3OriginAccessControl(scope, 'idxxxx', {
            originAccessControlName: `secure-static-website-${random}-origin-access-controle`,
            description: 'secure static website orgin access controle',
            signing: cloudfront.Signing.SIGV4_ALWAYS,
          }),
          originAccessLevels: [
            cloudfront.AccessLevel.READ,
          ],
        }),
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(scope, 'ResponseHeadersPolicy', {
          responseHeadersPolicyName: `secure-static-website-response-header-${random}-policy`,
          comment: 'A default policy',
          securityHeadersBehavior: {
            //contentSecurityPolicy: { contentSecurityPolicy: 'default-src https:;', override: true },
            contentTypeOptions: { override: true },
            frameOptions: {
              frameOption: cloudfront.HeadersFrameOption.SAMEORIGIN,
              override: true,
            },
            referrerPolicy: {
              referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
              override: true,
            },
            strictTransportSecurity: {
              accessControlMaxAge: cdk.Duration.seconds(31536000), // 1 year
              preload: true,
              includeSubdomains: true,
              override: true,
            },
            xssProtection: {
              protection: true,
              modeBlock: true,
              override: true,
            },
          },
          customHeadersBehavior: {
            customHeaders: [
              {
                header: 'Cache-Control',
                value: 'no-cache, no-store, private',
                override: true,
              },
              {
                header: 'pragma',
                value: 'no-cache',
                override: true,
              },
            ],
          },
        }),
      },
      errorResponses: [
        {
          ttl: cdk.Duration.seconds(300),
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        },
        {
          ttl: cdk.Duration.seconds(300),
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        },
      ],
      priceClass: props.priceClass,
    });
  }
}