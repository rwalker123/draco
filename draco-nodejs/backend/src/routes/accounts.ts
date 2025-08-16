// Main Accounts Router for Draco Sports Manager
// Combines all account-related sub-routers for organized routing

import { Router } from 'express';
import accountsCoreRouter from './accounts-core.js';
import accountsContactsRouter from './accounts-contacts.js';
import accountsRegistrationRouter from './accounts-registration.js';
import contactMediaRouter from './contact-media.js';
import accountsResourcesRouter from './accounts-resources.js';
import accountsSettingsRouter from './accounts-settings.js';
import accountsAssetsRouter from './accounts-assets.js';
import accountsWorkoutsRouter from './accounts-workouts.js';
import accountsPlayerClassifiedsRouter from './accounts-player-classifieds.js';

const router = Router({ mergeParams: true });

// Mount sub-routers with appropriate prefixes
// Core account operations (search, get, create, update, delete, my-accounts)
router.use('/', accountsCoreRouter);

// Contact and user management endpoints
router.use('/', accountsContactsRouter);

// Combined account registration endpoints
router.use('/', accountsRegistrationRouter);

// Contact media endpoints (photos)
router.use('/:accountId/contacts', contactMediaRouter);

// Resources endpoints (teams, leagues, fields, umpires)
router.use('/', accountsResourcesRouter);

// Settings endpoints (URLs, Twitter, types, affiliations)
router.use('/', accountsSettingsRouter);

// Assets endpoints (logo management)
router.use('/', accountsAssetsRouter);

// Workouts endpoints
router.use('/', accountsWorkoutsRouter);

// PlayerClassifieds endpoints
router.use('/:accountId/player-classifieds', accountsPlayerClassifiedsRouter);

export default router;
