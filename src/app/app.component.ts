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
    <main class="min-h-screen">
      <router-outlet />
    </main>
    <pmst-footer />
  `,
  styles: [``]
})
export class AppComponent {
  title = signal('PMST US-Nepal');
}
