import type { Locator, Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly contactInfoCard: Locator;
  readonly organizationsHeading: Locator;
  readonly teamsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Your Profile' });
    this.subtitle = page.getByText('Review your contact information');
    this.contactInfoCard = page.getByRole('heading', { name: 'Contact Information' });
    this.organizationsHeading = page.getByRole('heading', { name: 'Your Organizations' });
    this.teamsHeading = page.getByRole('heading', { name: /Teams at /i }).first();
  }

  async goto() {
    await this.page.goto('/profile');
    await this.heading.waitFor();
  }
}
