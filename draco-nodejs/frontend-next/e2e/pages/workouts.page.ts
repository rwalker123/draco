import type { Locator, Page } from '@playwright/test';

export class WorkoutsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createWorkoutFab: Locator;
  readonly manageWhereHeardButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Workouts Management', level: 1 });
    this.createWorkoutFab = page.getByRole('button', { name: /create workout/i });
    this.manageWhereHeardButton = page.getByRole('button', { name: /manage where heard/i });
    this.dialog = page.getByRole('dialog');
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/workouts`);
    await this.heading.waitFor({ timeout: 15_000 });
  }

  async openCreateWorkoutDialog() {
    await this.createWorkoutFab.click();
    await this.dialog.waitFor();
  }

  async openWorkoutSourcesDialog() {
    await this.manageWhereHeardButton.click();
    await this.dialog.waitFor();
  }
}
