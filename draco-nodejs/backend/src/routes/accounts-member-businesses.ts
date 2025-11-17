import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import {
  CreateMemberBusinessSchema,
  CreateMemberBusinessType,
  MemberBusinessQueryParamsSchema,
} from '@draco/shared-schemas';
import { ValidationError } from '../utils/customErrors.js';

declare global {
  namespace Express {
    interface Request {
      memberBusinessPayload?: CreateMemberBusinessType;
      memberBusinessSelfManaged?: boolean;
    }
  }
}

const router = Router({ mergeParams: true });
const memberBusinessService = ServiceFactory.getMemberBusinessService();
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();

const parseMemberBusinessId = (req: Request): bigint => {
  try {
    return BigInt(req.params.memberBusinessId);
  } catch (_error) {
    throw new ValidationError('memberBusinessId must be a valid identifier');
  }
};

const parseOptionalContactId = (contactId?: string) => {
  if (!contactId) {
    return undefined;
  }

  try {
    return BigInt(contactId);
  } catch (_error) {
    throw new ValidationError('contactId must be a valid identifier');
  }
};

const parseOptionalSeasonId = (seasonId?: string) => {
  if (!seasonId) {
    return undefined;
  }

  try {
    return BigInt(seasonId);
  } catch (_error) {
    throw new ValidationError('seasonId must be a valid identifier');
  }
};

type MemberBusinessAction = 'create' | 'update' | 'delete';

// Allows account members to manage their own member business records while
// falling back to the standard contact-management permission for broader access.
const requireSelfManagedOrPermission =
  (action: MemberBusinessAction) => async (req: Request, res: Response, next: NextFunction) => {
    const { accountId } = extractAccountParams(req.params);
    const accountContactId = req.accountBoundary?.contactId;

    const runPermissionCheck = () =>
      routeProtection.requirePermission('account.contacts.manage')(req, res, next);

    if (accountContactId === undefined || accountContactId === BigInt(0)) {
      return runPermissionCheck();
    }

    const currentContactId = accountContactId;

    const ensureSelfManaged = async (): Promise<boolean> => {
      switch (action) {
        case 'create': {
          const payload = CreateMemberBusinessSchema.parse(req.body) as CreateMemberBusinessType;
          req.memberBusinessPayload = payload;

          let payloadContactId: bigint;
          try {
            payloadContactId = BigInt(payload.contactId);
          } catch (_error) {
            throw new ValidationError('contactId must be a valid identifier');
          }

          if (payloadContactId !== currentContactId) {
            return false;
          }

          await contactService.getContact(accountId, currentContactId);
          return true;
        }
        case 'update': {
          const payload = CreateMemberBusinessSchema.parse(req.body) as CreateMemberBusinessType;
          req.memberBusinessPayload = payload;

          let payloadContactId: bigint;
          try {
            payloadContactId = BigInt(payload.contactId);
          } catch (_error) {
            throw new ValidationError('contactId must be a valid identifier');
          }

          if (payloadContactId !== currentContactId) {
            return false;
          }

          const memberBusinessId = parseMemberBusinessId(req);
          const record = await memberBusinessService.getMemberBusiness(accountId, memberBusinessId);

          return BigInt(record.contact.id) === currentContactId;
        }
        case 'delete': {
          const memberBusinessId = parseMemberBusinessId(req);
          const record = await memberBusinessService.getMemberBusiness(accountId, memberBusinessId);

          return BigInt(record.contact.id) === currentContactId;
        }
        default:
          return false;
      }
    };

    try {
      const isSelfManaged = await ensureSelfManaged();
      if (!isSelfManaged) {
        return runPermissionCheck();
      }

      req.memberBusinessSelfManaged = true;
      return next();
    } catch (error) {
      return next(error);
    }
  };

router.get(
  '/:accountId/member-businesses',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = MemberBusinessQueryParamsSchema.parse(req.query);
    const limit = typeof query.limit === 'number' ? Math.floor(query.limit) : undefined;
    const randomize = query.randomize ?? false;

    const memberBusinesses = await memberBusinessService.listMemberBusinesses(accountId, {
      contactId: parseOptionalContactId(query.contactId),
      seasonId: parseOptionalSeasonId(query.seasonId),
      limit,
      randomize,
    });

    res.json({ memberBusinesses });
  }),
);

router.get(
  '/:accountId/member-businesses/:memberBusinessId',
  optionalAuth,
  routeProtection.enforceAccountBoundaryIfAuthenticated(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const memberBusinessId = parseMemberBusinessId(req);

    const memberBusiness = await memberBusinessService.getMemberBusiness(
      accountId,
      memberBusinessId,
    );

    res.json(memberBusiness);
  }),
);

router.post(
  '/:accountId/member-businesses',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  requireSelfManagedOrPermission('create'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload =
      req.memberBusinessPayload ??
      (CreateMemberBusinessSchema.parse(req.body) as CreateMemberBusinessType);

    const memberBusiness = await memberBusinessService.createMemberBusiness(accountId, payload);

    res.status(201).json(memberBusiness);
  }),
);

router.put(
  '/:accountId/member-businesses/:memberBusinessId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  requireSelfManagedOrPermission('update'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const memberBusinessId = parseMemberBusinessId(req);
    const payload =
      req.memberBusinessPayload ??
      (CreateMemberBusinessSchema.parse(req.body) as CreateMemberBusinessType);

    const memberBusiness = await memberBusinessService.updateMemberBusiness(
      accountId,
      memberBusinessId,
      payload,
    );

    res.json(memberBusiness);
  }),
);

router.delete(
  '/:accountId/member-businesses/:memberBusinessId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  requireSelfManagedOrPermission('delete'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const memberBusinessId = parseMemberBusinessId(req);

    await memberBusinessService.deleteMemberBusiness(accountId, memberBusinessId);

    res.status(204).send();
  }),
);

export default router;
