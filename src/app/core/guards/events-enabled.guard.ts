import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';

/**
 * Redirects public event routes to the homepage when the admin has disabled
 * the Events feature via the site settings toggle.
 */
export const eventsEnabledGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  if (settingsService.eventsEnabled$()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
