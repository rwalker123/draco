import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../../services/serviceFactory.js';
import { partialMock } from '../../test-utils/partialMock.js';
import { AuthorizationError } from '../../utils/customErrors.js';

const PERMISSION = 'account.contacts.manage';
const SETTING_KEY = 'AllowTeamAdminPlayerEdits';

type RoleSvc = ReturnType<typeof ServiceFactory.getRoleService>;
type SettingsSvc = ReturnType<typeof ServiceFactory.getAccountSettingsService>;
type TeamSvc = ReturnType<typeof ServiceFactory.getTeamService>;
type RoleCheck = Awaited<ReturnType<RoleSvc['hasRole']>>;
type UserRoles = Awaited<ReturnType<RoleSvc['getUserRoles']>>;
type SettingState = Awaited<ReturnType<SettingsSvc['getAccountSettings']>>[number];
type TeamSeason = NonNullable<Awaited<ReturnType<TeamSvc['findTeamSeason']>>>;

const buildRequest = (): Request =>
  partialMock<Request>({
    user: { id: 'user-1', username: 'tester' },
    params: { accountId: '5', seasonId: '7', teamSeasonId: '9' },
    body: {},
    query: {},
  });

const settingState = (effectiveValue: boolean): SettingState =>
  partialMock<SettingState>({
    definition: partialMock<SettingState['definition']>({ key: SETTING_KEY }),
    effectiveValue,
  });

const runMiddleware = async (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
) => {
  const next = vi.fn();
  middleware(req, {} as Response, next);
  await vi.waitFor(() => expect(next).toHaveBeenCalled());
  return next;
};

describe('RouteProtection.requirePermissionOrTeamAdminWithSetting', () => {
  const hasPermission = vi.fn<RoleSvc['hasPermission']>();
  const hasRole = vi.fn<RoleSvc['hasRole']>();
  const getUserRoles = vi.fn<RoleSvc['getUserRoles']>();
  const getAccountSettings = vi.fn<SettingsSvc['getAccountSettings']>();

  const buildProtection = async () => {
    const { RouteProtection } = await import('../routeProtection.js');
    return new RouteProtection();
  };

  beforeEach(() => {
    hasPermission.mockReset();
    hasRole.mockReset();
    getUserRoles
      .mockReset()
      .mockResolvedValue(partialMock<UserRoles>({ globalRoles: [], contactRoles: [] }));
    getAccountSettings.mockReset();

    vi.spyOn(ServiceFactory, 'getRoleService').mockReturnValue(
      partialMock<RoleSvc>({ hasPermission, hasRole, getUserRoles }),
    );
    vi.spyOn(ServiceFactory, 'getContactService').mockReturnValue(
      partialMock<ReturnType<typeof ServiceFactory.getContactService>>({}),
    );
    vi.spyOn(ServiceFactory, 'getUserService').mockReturnValue(
      partialMock<ReturnType<typeof ServiceFactory.getUserService>>({}),
    );
    vi.spyOn(ServiceFactory, 'getTeamService').mockReturnValue(
      partialMock<TeamSvc>({
        findTeamSeason: vi
          .fn<TeamSvc['findTeamSeason']>()
          .mockResolvedValue(partialMock<TeamSeason>({ id: '9' })),
      }),
    );
    vi.spyOn(ServiceFactory, 'getAccountSettingsService').mockReturnValue(
      partialMock<SettingsSvc>({ getAccountSettings }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows an account-permission holder and marks them as an account-level editor', async () => {
    hasPermission.mockResolvedValue(true);
    const protection = await buildProtection();
    const middleware = protection.requirePermissionOrTeamAdminWithSetting(PERMISSION, SETTING_KEY);

    const req = buildRequest();
    const next = await runMiddleware(middleware, req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.isAccountLevelEditor).toBe(true);
    expect(hasRole).not.toHaveBeenCalled();
    expect(getAccountSettings).not.toHaveBeenCalled();
  });

  it('allows a team admin when the setting is enabled and marks them as not an account-level editor', async () => {
    hasPermission.mockResolvedValue(false);
    hasRole.mockResolvedValue(partialMock<RoleCheck>({ hasRole: true }));
    getAccountSettings.mockResolvedValue([settingState(true)]);
    const protection = await buildProtection();
    const middleware = protection.requirePermissionOrTeamAdminWithSetting(PERMISSION, SETTING_KEY);

    const req = buildRequest();
    const next = await runMiddleware(middleware, req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.isAccountLevelEditor).toBe(false);
  });

  it('denies a team admin when the setting is disabled', async () => {
    hasPermission.mockResolvedValue(false);
    hasRole.mockResolvedValue(partialMock<RoleCheck>({ hasRole: true }));
    getAccountSettings.mockResolvedValue([settingState(false)]);
    const protection = await buildProtection();
    const middleware = protection.requirePermissionOrTeamAdminWithSetting(PERMISSION, SETTING_KEY);

    const req = buildRequest();
    const next = await runMiddleware(middleware, req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AuthorizationError);
    expect(req.isAccountLevelEditor).toBeUndefined();
  });

  it('denies a user who is neither an account editor nor a team admin', async () => {
    hasPermission.mockResolvedValue(false);
    hasRole.mockResolvedValue(partialMock<RoleCheck>({ hasRole: false }));
    const protection = await buildProtection();
    const middleware = protection.requirePermissionOrTeamAdminWithSetting(PERMISSION, SETTING_KEY);

    const req = buildRequest();
    const next = await runMiddleware(middleware, req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AuthorizationError);
    expect(getAccountSettings).not.toHaveBeenCalled();
  });
});
