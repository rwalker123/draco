import type { Locator, Page } from '@playwright/test';

export class UserManagementPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly withRolesToggle: Locator;
  readonly exportButton: Locator;
  readonly tableViewButton: Locator;
  readonly cardViewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /user management/i });
    this.searchInput = page.getByPlaceholder('Search users...');
    this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
    this.withRolesToggle = page.getByText('With roles only');
    this.exportButton = page.getByRole('button', { name: 'Export' });
    this.tableViewButton = page.getByRole('button', { name: 'Switch to table view' });
    this.cardViewButton = page.getByRole('button', { name: 'Switch to card view' });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/users`);
    await this.page.waitForLoadState('networkidle');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }

  async switchToCardView() {
    await this.cardViewButton.click();
  }

  async switchToTableView() {
    await this.tableViewButton.click();
  }

  async toggleWithRolesOnly() {
    await this.withRolesToggle.click();
  }
}
