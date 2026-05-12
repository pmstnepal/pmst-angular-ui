export const environment = {
  production: false,
  // apiUrl: 'https://api.pmstusnepal.com/v1', // production — uncomment when AWS is live
  apiUrl: 'http://localhost:8080', // pmst-api-service (articles, galleries, users, follows, comments)
  ticketingUrl: 'http://localhost:8081', // pmst-ticketing-service (events, tickets — planned)
  appName: 'PMST US-Nepal'
};
