// Main Accounts Router for Draco Sports Manager
// Combines all account-related sub-routers for organized routing

import { Router } from 'express';
import accountsCoreRouter from './accounts-core';
import accountsContactsRouter from './accounts-contacts';
import contactMediaRouter from './contact-media';
import accountsResourcesRouter from './accounts-resources';
import accountsSettingsRouter from './accounts-settings';
import accountsAssetsRouter from './accounts-assets';

const router = Router({ mergeParams: true });

// Mount sub-routers with appropriate prefixes
// Core account operations (search, get, create, update, delete, my-accounts)
router.use('/', accountsCoreRouter);

// Contact and user management endpoints
router.use('/', accountsContactsRouter);

// Contact media endpoints (photos)
router.use('/:accountId/contacts', contactMediaRouter);

// Resources endpoints (teams, leagues, fields, umpires)
router.use('/', accountsResourcesRouter);

// Settings endpoints (URLs, Twitter, types, affiliations)
router.use('/', accountsSettingsRouter);

// Assets endpoints (logo management)
router.use('/', accountsAssetsRouter);

export default router;
