import { Request } from 'express';
import { ValidationError } from './customErrors.js';
import { ContactInputData } from '../interfaces/contactInterfaces.js';

export interface TeamUpdateRequest {
  name: string;
}

export interface AddPlayerToRosterRequest {
  contactId?: string;
  contactData?: ContactInputData;
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export interface UpdateRosterMemberRequest {
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export class TeamRequestValidator {
  static validateTeamUpdateRequest(req: Request): TeamUpdateRequest {
    const { name } = req.body;

    if (!name || !name.trim()) {
      throw new ValidationError('Team name is required');
    }

    return {
      name: name.trim(),
    };
  }

  static validateAddPlayerRequest(req: Request): AddPlayerToRosterRequest {
    const {
      contactId,
      contactData,
      playerNumber,
      submittedWaiver,
      submittedDriversLicense,
      firstYear,
    } = req.body;

    // Validate that either contactId or contactData is provided
    if (!contactId && !contactData) {
      throw new ValidationError('Either contactId or contactData is required');
    }

    // If contactData is provided, validate required fields
    if (contactData && (!contactData.firstname || !contactData.lastname)) {
      throw new ValidationError('First name and last name are required for contact creation');
    }

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
    }

    return {
      contactId,
      contactData,
      playerNumber,
      submittedWaiver,
      submittedDriversLicense,
      firstYear,
    };
  }

  static validateUpdateRosterMemberRequest(req: Request): UpdateRosterMemberRequest {
    const { playerNumber, submittedWaiver, submittedDriversLicense, firstYear } = req.body;

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
    }

    return {
      playerNumber,
      submittedWaiver,
      submittedDriversLicense,
      firstYear,
    };
  }

  static validateQueryParams(req: Request) {
    return {
      full: req.query.full === '1' || req.query.full === 'true',
      upcoming: req.query.upcoming,
      recent: req.query.recent,
      limit: req.query.limit,
    };
  }

  static validateGameQueryParams(req: Request) {
    const { upcoming, recent, limit } = req.query;
    const limitNum = Number(limit) > 0 ? Number(limit) : 5;
    const includeUpcoming = upcoming === 'true' || (!upcoming && !recent);
    const includeRecent = recent === 'true' || (!upcoming && !recent);

    return {
      limitNum,
      includeUpcoming,
      includeRecent,
    };
  }
}

export class FileValidator {
  static validateLogoFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    // Additional file validation would go here
    // This would typically import from the existing logo validation
    return file;
  }
}
