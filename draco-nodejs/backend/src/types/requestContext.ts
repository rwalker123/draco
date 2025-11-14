import type { UserRolesType } from '@draco/shared-schemas';

export interface TeamRequestContext {
  teamId: bigint;
  seasonId: bigint;
}

export interface DracoRequestContext {
  teamContext?: TeamRequestContext;
}

export interface AccountBoundaryContext {
  accountId: bigint;
  contactId: bigint;
  enforced: boolean;
}

export interface AccountContext {
  id: bigint;
  name: string;
  accounttypeid: bigint;
  accounttypes?: {
    id: bigint;
    name: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
      userRoles?: UserRolesType;
      accountBoundary?: AccountBoundaryContext;
      accountId?: string;
      account?: AccountContext;
      hasAccountRoleAccess?: boolean;
      draco?: DracoRequestContext;
    }
  }
}
