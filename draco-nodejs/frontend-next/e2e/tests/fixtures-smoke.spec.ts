import { mergeTests, expect } from '@playwright/test';
import { test as accountTest } from '../fixtures/account-scoped-fixtures';
import { test as teamTest } from '../fixtures/team-scoped-fixtures';
import { test as contactTest } from '../fixtures/contact-scoped-fixtures';

const test = mergeTests(accountTest, teamTest, contactTest);

test.describe('fixture smoke', () => {
  test('accountScoped provides league + leagueSeason under test account', ({ accountScoped }) => {
    expect(accountScoped.accountId).toBe(process.env.E2E_TEST_ACCOUNT_ID);
    expect(accountScoped.seasonId).toBeTruthy();
    expect(accountScoped.leagueId).toBeTruthy();
    expect(accountScoped.leagueSeasonId).toBeTruthy();
    expect(accountScoped.suffix).toMatch(/\d+w\d+/);
  });

  test('teamScoped provides team + roster', ({ teamScoped }) => {
    expect(teamScoped.accountId).toBe(process.env.E2E_TEST_ACCOUNT_ID);
    expect(teamScoped.teamId).toBeTruthy();
    expect(teamScoped.teamSeasonId).toBeTruthy();
    expect(teamScoped.teamName).toContain('E2E Tm');
    expect(teamScoped.rosterContactIds).toHaveLength(3);
    expect(teamScoped.rosterMemberIds).toHaveLength(3);
    for (const id of teamScoped.rosterContactIds) expect(id).toBeTruthy();
    for (const id of teamScoped.rosterMemberIds) expect(id).toBeTruthy();
  });

  test('contactScoped provides player pool + manager', ({ contactScoped }) => {
    expect(contactScoped.accountId).toBe(process.env.E2E_TEST_ACCOUNT_ID);
    expect(contactScoped.players.length).toBeGreaterThanOrEqual(3);
    for (const p of contactScoped.players) {
      expect(p.id).toBeTruthy();
      expect(p.firstName).toBe('E2E');
      expect(p.lastName).toContain('Plr');
    }
    expect(contactScoped.manager.id).toBeTruthy();
    expect(contactScoped.manager.lastName).toContain('Mgr');
  });
});
