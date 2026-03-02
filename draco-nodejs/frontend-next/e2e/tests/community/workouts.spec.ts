import { test, expect } from '../../fixtures/base-fixtures';
import { WorkoutsPage } from '../../pages/workouts.page';

test.describe('Workouts Management', () => {
  let workoutsPage: WorkoutsPage;

  test.beforeEach(async ({ page, accountId }) => {
    workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto(accountId);
  });

  test('workouts page loads with heading visible', async () => {
    await expect(workoutsPage.heading).toBeVisible();
  });

  test('FAB create workout button is visible', async () => {
    await expect(workoutsPage.createWorkoutFab).toBeVisible();
  });

  test('can open create workout dialog', async () => {
    await workoutsPage.openCreateWorkoutDialog();
    await expect(workoutsPage.dialog).toBeVisible();
  });

  test('create workout dialog can be closed', async () => {
    await workoutsPage.openCreateWorkoutDialog();
    await expect(workoutsPage.dialog).toBeVisible();
    const cancelButton = workoutsPage.dialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    await expect(workoutsPage.dialog).not.toBeVisible();
  });

  test('Manage Where Heard button is visible', async () => {
    await expect(workoutsPage.manageWhereHeardButton).toBeVisible();
  });

  test('can open workout sources dialog', async () => {
    await workoutsPage.openWorkoutSourcesDialog();
    await expect(workoutsPage.dialog).toBeVisible();
  });

  test('workout sources dialog can be closed', async () => {
    await workoutsPage.openWorkoutSourcesDialog();
    await expect(workoutsPage.dialog).toBeVisible();
    const closeButton = workoutsPage.dialog.getByRole('button', { name: /close/i });
    await closeButton.click();
    await expect(workoutsPage.dialog).not.toBeVisible();
  });
});
