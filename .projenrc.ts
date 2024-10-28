import { awscdk, javascript } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'yicr',
  authorAddress: 'yicr@users.noreply.github.com',
  authorOrganization: true,
  cdkVersion: '2.156.0',
  typescriptVersion: '5.5.x',
  jsiiVersion: '5.5.x',
  defaultReleaseBranch: 'main',
  name: '@gammarers/aws-cloudfront-secure-static-website-distribution',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/gammarers/aws-cloudfront-secure-static-website-distribution.git',
  releaseToNpm: false,
  npmAccess: javascript.NpmAccess.PUBLIC,
  minNodeVersion: '18.0.0',
  workflowNodeVersion: '22.4.x',
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      schedule: javascript.UpgradeDependenciesSchedule.expressions(['3 18 * * 0']), // every sunday 18:00 (JST/MON:0300)
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['yicr'],
  },
});
project.synth();