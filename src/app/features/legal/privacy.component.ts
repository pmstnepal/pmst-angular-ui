import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'pmst-privacy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-700 leading-relaxed">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p class="text-sm text-gray-500 mb-8">Last updated: 19 November 2026</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Introduction</h2>
        <p class="mb-4"> PMST US-Nepal ("we") runs pmstusnepal.com. We also run internal tools that use the YouTube Data API to manage our own YouTube channel. Only PMST staff use these tools. They are not offered to the public.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Website accounts</h2>
        <p class="mb-4"> When you register on pmstusnepal.com you provide your first name, last name, email address and a password. We use this information to create and run your account and the site features you use, such as submitting articles and comments. Accounts and sign-in are managed through Amazon Cognito.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> YouTube data we access</h2>
        <p class="mb-4"> Our tools read public YouTube information (video titles, channel names, view, like and comment counts, and the time public comments were posted) to curate PMST playlists and to plan when PMST publishes. With the channel owner's authorization, they upload videos to the PMST channel; set their titles, descriptions, thumbnails, captions, privacy and scheduled publish time; post comments on PMST's own videos; add and remove items in PMST playlists; and read PMST's own channel analytics. We do not access private data of any other YouTube account.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Storage and sharing</h2>
        <p class="mb-4"> OAuth tokens, operational logs, upload records (video ID, upload time, privacy status, scheduled time) and aggregated statistics are stored only on PMST computers and are never sold or shared with third parties, and are not used for advertising. Data obtained from the YouTube API is deleted or refreshed within 30 days.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Google policies</h2>
        <p class="mb-4"> Our use of information received from Google APIs follows the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">Google API Services User Data Policy</a>, including the Limited Use requirements. These tools use YouTube API Services. By using them you are also bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">YouTube Terms of Service</a>. See also the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">Google Privacy Policy</a>.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Advertising</h2>
        <p class="mb-4"> Our website uses Google AdSense to show ads. Google and its partners use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">adssettings.google.com</a>, or learn more about opting out of third-party vendors' use of cookies at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">aboutads.info</a>.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Revoking access</h2>
        <p class="mb-4"> You can review and revoke access that you have granted to any application at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">https://myaccount.google.com/permissions</a>.</p>
        <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-2"> Contact</h2>
        <p class="mb-4"> Questions about this policy: <a href="mailto:info@pmstusnepal.com" class="text-indigo-600 hover:text-indigo-700 underline">info&#64;pmstusnepal.com</a>.</p>
      </div>
    </div>
  `
})
export class PrivacyComponent {
  constructor() {
    inject(Title).setTitle('Privacy Policy | PMST US-Nepal');
  }
}
