import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/context';

const angularAppEngine = new AngularAppEngine();

/**
 * Request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(async (req: Request) => {
  const context = getContext();

  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(req.url).pathname;
  // if (pathname === '/api/hello') {
  //   return new Response('Hello from the API');
  // }

  const result = await angularAppEngine.handle(req, context);
  return result || new Response('Not found', { status: 404 });
});
