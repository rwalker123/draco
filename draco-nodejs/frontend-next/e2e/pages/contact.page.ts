import type { Locator, Page } from '@playwright/test';

export class ContactPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly subjectField: Locator;
  readonly messageField: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Contact Us' });
    this.nameField = page.getByRole('textbox', { name: 'Name' });
    this.emailField = page.getByRole('textbox', { name: 'Email' });
    this.subjectField = page.getByRole('textbox', { name: 'Subject' });
    this.messageField = page.getByRole('textbox', { name: 'Message' });
    this.submitButton = page.getByRole('button', { name: 'Send Message' });
  }

  async goto() {
    await this.page.goto('/contact');
    await this.heading.waitFor();
  }
}
