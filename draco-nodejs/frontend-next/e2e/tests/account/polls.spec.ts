import { test, expect } from '../../fixtures/base-fixtures';
import { PollManagementPage } from '../../pages/polls.page';

test.describe('Poll Management', () => {
  let pollsPage: PollManagementPage;

  test.beforeEach(async ({ page, accountId }) => {
    pollsPage = new PollManagementPage(page);
    await pollsPage.goto(accountId);
  });

  test('page loads with heading', async () => {
    await expect(pollsPage.heading).toBeVisible();
  });

  test('displays poll table or empty message', async () => {
    const tableOrEmpty = pollsPage.pollTable.or(pollsPage.noPollsMessage);
    await expect(tableOrEmpty).toBeVisible();
  });

  test('displays add poll FAB', async () => {
    await expect(pollsPage.addPollFab).toBeVisible();
  });

  test('can open poll editor dialog', async () => {
    await pollsPage.openCreateDialog();
    await expect(pollsPage.editorDialog).toBeVisible();
  });

  test('poll editor dialog can be closed', async () => {
    await pollsPage.openCreateDialog();
    await expect(pollsPage.editorDialog).toBeVisible();

    const closeButton = pollsPage.editorDialog.getByRole('button', { name: /close|cancel/i });
    await closeButton.click();
    await expect(pollsPage.editorDialog).not.toBeVisible();
  });
});
