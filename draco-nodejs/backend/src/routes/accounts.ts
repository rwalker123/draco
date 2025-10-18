// Main Accounts Router for Draco Sports Manager
// Combines all account-related sub-routers for organized routing

import { Router } from 'express';
import accountsCoreRouter from './accounts-core.js';
import accountsContactsRouter from './accounts-contacts.js';
import contactMediaRouter from './contact-media.js';
import accountsResourcesRouter from './accounts-resources.js';
import accountsSettingsRouter from './accounts-settings.js';
import accountsAssetsRouter from './accounts-assets.js';
import accountsWorkoutsRouter from './accounts-workouts.js';
import accountsPlayerClassifiedsRouter from './accounts-player-classifieds.js';
import accountsSponsorsRouter from './accounts-sponsors.js';
import accountsPollsRouter from './accounts-polls.js';
import accountsHandoutsRouter from './accounts-handouts.js';
import accountsPhotoSubmissionsRouter from './accounts-photo-submissions.js';

const router = Router({ mergeParams: true });

// Mount sub-routers with appropriate prefixes
// Contact and user management endpoints
router.use('/', accountsContactsRouter);

// Contact media endpoints (photos)
router.use('/:accountId/contacts', contactMediaRouter);

// Photo submission endpoints
router.use('/', accountsPhotoSubmissionsRouter);

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

// Core account operations (search, get, create, update, delete, my-accounts)
// Placed last so static routes like /types are matched before the generic /:accountId handler
router.use('/', accountsCoreRouter);

// Sponsor management endpoints
router.use('/', accountsSponsorsRouter);

// Poll management endpoints
router.use('/', accountsPollsRouter);

// Handout management endpoints
router.use('/', accountsHandoutsRouter);

export default router;
