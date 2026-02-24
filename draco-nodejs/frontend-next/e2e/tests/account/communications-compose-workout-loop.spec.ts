import { test, expect } from '../../fixtures/base-fixtures';

const MOCK_WORKOUT_ID = '999001';

const mockWorkouts = [
  {
    id: MOCK_WORKOUT_ID,
    workoutDesc: 'E2E Test Workout',
    workoutDate: new Date().toISOString(),
    registrationCount: 2,
  },
];

const mockRegistrations = {
  registrations: [
    {
      id: 'reg-1',
      firstName: 'Test',
      lastName: 'Player1',
      email: 'test1@example.com',
      isManager: false,
    },
    {
      id: 'reg-2',
      firstName: 'Test',
      lastName: 'Player2',
      email: 'test2@example.com',
      isManager: false,
    },
  ],
};

test.describe('Communications Compose - Workout Selection Loop', () => {
  test('does not trigger Maximum update depth exceeded when reopening recipient dialog with workout selections', async ({
    page,
    accountId,
  }) => {
    test.setTimeout(60000);

    let loopErrorCount = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });
    page.on('pageerror', (error) => {
      if (error.message.includes('Maximum update depth exceeded')) {
        loopErrorCount++;
      }
    });

    await page.route('**/api/accounts/*/workouts?*status=upcoming*', (route) => {
      return route.fulfill({ json: mockWorkouts });
    });

    await page.route('**/api/accounts/*/workouts?*status=past*', (route) => {
      return route.fulfill({ json: [] });
    });

    await page.route(`**/api/accounts/*/workouts/${MOCK_WORKOUT_ID}/registrations*`, (route) => {
      return route.fulfill({ json: mockRegistrations });
    });

    await page.goto(`/account/${accountId}/communications/compose`);

    await page.getByRole('button', { name: 'Select Recipients' }).click();

    const workoutsTab = page.getByRole('tab', { name: 'Workouts' });
    await workoutsTab.waitFor({ timeout: 10000 });
    await workoutsTab.click();

    const workoutCheckbox = page
      .getByRole('heading', { name: 'E2E Test Workout' })
      .locator('..')
      .getByRole('checkbox');
    await workoutCheckbox.waitFor({ timeout: 5000 });
    await workoutCheckbox.check();

    await page.getByRole('button', { name: 'Apply Selection' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Select Recipients' }).click();

    await page.waitForTimeout(5000);

    expect(loopErrorCount, 'useWorkoutSelection should not cause infinite re-renders').toBe(0);
  });
});
