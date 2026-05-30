// TEST environment. Values are overwritten by CI from deploy/environments.yaml
// at build time (the single source of truth). This file is the local fallback.
export const environment = {
  production: false,
  apiUrl: 'https://REPLACE_WITH_TEST_API.execute-api.us-east-1.amazonaws.com',
  appName: 'PMST US-Nepal (test)',
  cfDomain: 'https://REPLACE_WITH_TEST_CF.cloudfront.net'
};
