import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { ImageUrlMapperService } from './services/image-url-mapper.service';

/**
 * Initialize image manifest before app renders
 * This ensures all image paths are available when components load
 */
export function initializeImageManifest(mapper: ImageUrlMapperService): () => Promise<void> {
  return () => mapper.loadManifest();
}

export const config: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeImageManifest,
      deps: [ImageUrlMapperService],
      multi: true
    }
  ]
};
