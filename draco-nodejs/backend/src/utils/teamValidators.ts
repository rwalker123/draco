// todo: (code review flag) this file eventually will be replaced by zod schema validation
import { Request } from 'express';
import { ValidationError } from './customErrors.js';

export interface TeamUpdateRequest {
  name: string;
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

  static validateQueryParams(req: Request) {
    return {
      full: req.query.full === '1' || req.query.full === 'true',
      upcoming: req.query.upcoming,
      recent: req.query.recent,
      limit: req.query.limit,
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
