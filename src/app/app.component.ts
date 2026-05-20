import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';

@Component({
  selector: 'pmst-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <pmst-header />
    <main class="main-content">
      <router-outlet />
    </main>
    <pmst-footer />
  `,
  styles: [`
    :host {
      display: block;
    }
    .main-content {
      min-height: 100vh;
      display: block;
    }
  `]
})
export class AppComponent {
  title = signal('PMST US-Nepal');
}
