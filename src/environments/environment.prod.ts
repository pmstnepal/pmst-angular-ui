export const environment = {
  production: true,
  // API Gateway invoke URL (no custom API domain). All routes are served under
  // /prod/api/** (pmst-api-service) and /prod/tickets/** (ticketing-service).
  apiUrl: 'https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/api',
  ticketingUrl: 'https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/tickets',
  appName: 'PMST US-Nepal',
  cfDomain: 'https://d2f5kzshaq1nf6.cloudfront.net'
};
