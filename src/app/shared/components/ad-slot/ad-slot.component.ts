import { AfterViewInit, ChangeDetectionStrategy, Component, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'pmst-ad-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (client) {
      <ins class="adsbygoogle pmst-ad" style="display:block"
           [attr.data-ad-client]="client"
           [attr.data-ad-slot]="slot()"
           [attr.data-ad-format]="format()"
           data-full-width-responsive="true"></ins>
    }
  `,
  styles: [`
    .pmst-ad {
      display: block;
    }
  `]
})
export class AdSlotComponent implements AfterViewInit {
  slot = input.required<string>();
  format = input<string>('auto');

  readonly client = environment.adsenseClient;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!this.client || !isPlatformBrowser(this.platformId)) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }
}
