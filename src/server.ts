import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  return renderApplication(
    () => bootstrapApplication(AppComponent, config),
    {
      url: req.url,
      document: '<!DOCTYPE html><html><head></head><body><pmst-root></pmst-root></body></html>'
    }
  ).then(html => {
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  });
};
