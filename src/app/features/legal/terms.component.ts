import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'pmst-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-700 leading-relaxed">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p class="text-sm text-gray-500 mb-8">Last updated: 19 November 2026</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Use of the site</h2>
        <p class="mb-4"> By using pmstusnepal.com you agree to these terms. Use the site lawfully and do not try to disrupt it or access areas you are not authorized to use.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> User accounts and content</h2>
        <p class="mb-4"> You are responsible for your account and for keeping your password secure. Registered users can submit articles, which are reviewed before publication, and post comments. You are responsible for the content you submit and must have the right to share it. Do not submit unlawful, abusive or infringing material.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Content removal</h2>
        <p class="mb-4"> PMST may reject, edit or remove any content, and may suspend accounts, at our discretion.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> No warranty</h2>
        <p class="mb-4"> The site and its content are provided "as is" without warranties of any kind. We do not guarantee that the site will be available or error-free, and we are not liable for losses arising from its use.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Third-party links</h2>
        <p class="mb-4"> The site may link to third-party sites that we do not control. We are not responsible for their content or practices.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> YouTube</h2>
        <p class="mb-4"> YouTube content and features are subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">YouTube Terms of Service</a>.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Privacy and contact</h2>
        <p class="mb-4"> See our <a routerLink="/privacy" class="text-indigo-600 hover:text-indigo-700 underline">Privacy Policy</a>. Questions: <a href="mailto:info@pmstusnepal.com" class="text-indigo-600 hover:text-indigo-700 underline">info&#64;pmstusnepal.com</a>.</p>
      </div>
    </div>
  `
})
export class TermsComponent {
  constructor() {
    inject(Title).setTitle('Terms of Service | PMST US-Nepal');
  }
}
