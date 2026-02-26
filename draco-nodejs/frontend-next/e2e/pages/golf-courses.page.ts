import type { Locator, Page } from '@playwright/test';

export class GolfCoursesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchFab: Locator;
  readonly dialog: Locator;
  readonly mainContent: Locator;
  readonly breadcrumbs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Golf Courses', level: 1 });
    this.searchFab = page.getByRole('button', { name: 'Find a course' });
    this.dialog = page.getByRole('dialog');
    this.mainContent = page.locator('main');
    this.breadcrumbs = page.getByRole('navigation', { name: /breadcrumb/i });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/golf/courses`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openSearchDialog() {
    await this.searchFab.click();
    await this.dialog.waitFor();
  }

  async closeSearchDialog() {
    const closeButton = this.dialog.getByRole('button', { name: 'Cancel' });
    await closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}

export class GolfCourseDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.backButton = page.getByRole('button', { name: 'Back to Courses' });
    this.mainContent = page.locator('main');
  }

  async goto(accountId: string, courseId: string) {
    await this.page.goto(`/account/${accountId}/golf/courses/${courseId}`);
    await this.heading.waitFor({ timeout: 15_000 });
  }
}
