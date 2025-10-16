import path from 'node:path';
import { HandoutType } from '@draco/shared-schemas';
import { validateAttachmentFile } from '../config/attachments.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IHandoutRepository, ITeamRepository } from '../repositories/interfaces/index.js';
import { HandoutResponseFormatter } from '../responseFormatters/handoutResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { createStorageService, StorageService } from './storageService.js';
import { dbAccountHandout, dbTeamHandout } from '../repositories/types/index.js';

interface HandoutFilePayload {
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
  size?: number;
}

interface HandoutWritePayload {
  description: string;
  file?: HandoutFilePayload;
}

export class HandoutService {
  private readonly handoutRepository: IHandoutRepository;
  private readonly teamRepository: ITeamRepository;
  private readonly storageService: StorageService;

  constructor() {
    this.handoutRepository = RepositoryFactory.getHandoutRepository();
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.storageService = createStorageService();
  }

  async listAccountHandouts(accountId: bigint): Promise<HandoutType[]> {
    const handouts = await this.handoutRepository.listAccountHandouts(accountId);
    return HandoutResponseFormatter.formatAccountHandouts(handouts);
  }

  async listTeamHandouts(accountId: bigint, teamId: bigint): Promise<HandoutType[]> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const handouts = await this.handoutRepository.listTeamHandouts(teamId);
    return HandoutResponseFormatter.formatTeamHandouts(handouts, accountId);
  }

  async createAccountHandout(
    accountId: bigint,
    payload: HandoutWritePayload,
  ): Promise<HandoutType> {
    const normalized = this.normalizePayload(payload);

    if (!normalized.file) {
      throw new ValidationError('Handout file is required');
    }

    const dbRecord = await this.handoutRepository.createAccountHandout({
      accountid: accountId,
      description: normalized.description,
      filename: normalized.file.safeFileName,
    });

    await this.storageService.saveHandout(
      accountId.toString(),
      dbRecord.id.toString(),
      normalized.file.safeFileName,
      normalized.file.buffer,
    );

    const handout = await this.requireAccountHandout(accountId, dbRecord.id);
    return HandoutResponseFormatter.formatAccountHandout(handout);
  }

  async updateAccountHandout(
    accountId: bigint,
    handoutId: bigint,
    payload: HandoutWritePayload,
  ): Promise<HandoutType> {
    const existing = await this.requireAccountHandout(accountId, handoutId);
    const normalized = this.normalizePayload(payload, existing.filename);

    if (normalized.file) {
      const shouldDeleteOldFile = existing.filename !== normalized.file.safeFileName;

      await this.storageService.saveHandout(
        accountId.toString(),
        handoutId.toString(),
        normalized.file.safeFileName,
        normalized.file.buffer,
      );

      try {
        await this.handoutRepository.updateAccountHandout(handoutId, {
          description: normalized.description,
          filename: normalized.file.safeFileName,
        });
      } catch (error) {
        if (shouldDeleteOldFile) {
          await this.storageService
            .deleteHandout(accountId.toString(), handoutId.toString(), normalized.file.safeFileName)
            .catch(() => {});
        }
        throw error;
      }

      if (shouldDeleteOldFile) {
        await this.storageService.deleteHandout(
          accountId.toString(),
          handoutId.toString(),
          existing.filename,
        );
      }
    } else {
      await this.handoutRepository.updateAccountHandout(handoutId, {
        description: normalized.description,
      });
    }

    const updated = await this.requireAccountHandout(accountId, handoutId);
    return HandoutResponseFormatter.formatAccountHandout(updated);
  }

  async deleteAccountHandout(accountId: bigint, handoutId: bigint): Promise<void> {
    const handout = await this.requireAccountHandout(accountId, handoutId);
    await this.handoutRepository.deleteAccountHandout(handoutId);
    await this.storageService.deleteHandout(
      accountId.toString(),
      handoutId.toString(),
      handout.filename,
    );
  }

  async createTeamHandout(
    accountId: bigint,
    teamId: bigint,
    payload: HandoutWritePayload,
  ): Promise<HandoutType> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const normalized = this.normalizePayload(payload);

    if (!normalized.file) {
      throw new ValidationError('Handout file is required');
    }

    const dbRecord = await this.handoutRepository.createTeamHandout({
      teamid: teamId,
      description: normalized.description,
      filename: normalized.file.safeFileName,
    });

    await this.storageService.saveHandout(
      accountId.toString(),
      dbRecord.id.toString(),
      normalized.file.safeFileName,
      normalized.file.buffer,
      teamId.toString(),
    );

    const handout = await this.requireTeamHandout(accountId, teamId, dbRecord.id);
    return HandoutResponseFormatter.formatTeamHandout(handout, accountId);
  }

  async updateTeamHandout(
    accountId: bigint,
    teamId: bigint,
    handoutId: bigint,
    payload: HandoutWritePayload,
  ): Promise<HandoutType> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const existing = await this.requireTeamHandout(accountId, teamId, handoutId);
    const normalized = this.normalizePayload(payload, existing.filename);

    if (normalized.file) {
      const shouldDeleteOldFile = existing.filename !== normalized.file.safeFileName;

      await this.storageService.saveHandout(
        accountId.toString(),
        handoutId.toString(),
        normalized.file.safeFileName,
        normalized.file.buffer,
        teamId.toString(),
      );

      try {
        await this.handoutRepository.updateTeamHandout(handoutId, {
          description: normalized.description,
          filename: normalized.file.safeFileName,
        });
      } catch (error) {
        if (shouldDeleteOldFile) {
          await this.storageService
            .deleteHandout(
              accountId.toString(),
              handoutId.toString(),
              normalized.file.safeFileName,
              teamId.toString(),
            )
            .catch(() => {});
        }
        throw error;
      }

      if (shouldDeleteOldFile) {
        await this.storageService.deleteHandout(
          accountId.toString(),
          handoutId.toString(),
          existing.filename,
          teamId.toString(),
        );
      }
    } else {
      await this.handoutRepository.updateTeamHandout(handoutId, {
        description: normalized.description,
      });
    }

    const updated = await this.requireTeamHandout(accountId, teamId, handoutId);
    return HandoutResponseFormatter.formatTeamHandout(updated, accountId);
  }

  async deleteTeamHandout(accountId: bigint, teamId: bigint, handoutId: bigint): Promise<void> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const handout = await this.requireTeamHandout(accountId, teamId, handoutId);
    await this.handoutRepository.deleteTeamHandout(handoutId);
    await this.storageService.deleteHandout(
      accountId.toString(),
      handoutId.toString(),
      handout.filename,
      teamId.toString(),
    );
  }

  async getAccountHandoutFile(
    accountId: bigint,
    handoutId: bigint,
  ): Promise<{ fileName: string; buffer: Buffer }> {
    const handout = await this.requireAccountHandout(accountId, handoutId);
    const buffer = await this.storageService.getHandout(
      accountId.toString(),
      handoutId.toString(),
      handout.filename,
    );

    if (!buffer) {
      throw new NotFoundError('Handout file not found');
    }

    return { fileName: handout.filename, buffer };
  }

  async getTeamHandoutFile(
    accountId: bigint,
    teamId: bigint,
    handoutId: bigint,
  ): Promise<{ fileName: string; buffer: Buffer }> {
    await this.ensureTeamBelongsToAccount(accountId, teamId);
    const handout = await this.requireTeamHandout(accountId, teamId, handoutId);
    const buffer = await this.storageService.getHandout(
      accountId.toString(),
      handoutId.toString(),
      handout.filename,
      teamId.toString(),
    );

    if (!buffer) {
      throw new NotFoundError('Handout file not found');
    }

    return { fileName: handout.filename, buffer };
  }

  private async requireAccountHandout(
    accountId: bigint,
    handoutId: bigint,
  ): Promise<dbAccountHandout> {
    const handout = await this.handoutRepository.findAccountHandoutById(handoutId, accountId);
    if (!handout) {
      throw new NotFoundError('Handout not found');
    }
    return handout;
  }

  private async requireTeamHandout(
    accountId: bigint,
    teamId: bigint,
    handoutId: bigint,
  ): Promise<dbTeamHandout> {
    const handout = await this.handoutRepository.findTeamHandoutById(handoutId, teamId);
    if (!handout || !handout.teams || handout.teams.accountid !== accountId) {
      throw new NotFoundError('Handout not found for this team');
    }
    return handout;
  }

  private async ensureTeamBelongsToAccount(accountId: bigint, teamId: bigint) {
    const team = await this.teamRepository.findTeamDefinition(teamId);
    if (!team || team.accountid !== accountId) {
      throw new NotFoundError('Team not found');
    }
    return team;
  }

  private normalizePayload(payload: HandoutWritePayload, existingFileName?: string) {
    const description = payload.description.trim();
    if (!description) {
      throw new ValidationError('Description is required');
    }

    if (!payload.file) {
      return { description, file: undefined };
    }

    const validationError = validateAttachmentFile({
      mimetype: payload.file.mimeType,
      size: payload.file.size,
      originalname: payload.file.originalName,
    });

    if (validationError) {
      throw new ValidationError(validationError);
    }

    const safeFileName = this.sanitizeFileName(payload.file.originalName, existingFileName);

    return {
      description,
      file: {
        buffer: payload.file.buffer,
        safeFileName,
      },
    };
  }

  private sanitizeFileName(originalName: string, fallback?: string): string {
    const trimmed = originalName?.trim();
    if (!trimmed) {
      return fallback ?? 'handout';
    }

    const baseName = path.basename(trimmed);
    const sanitized = baseName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const limited = sanitized.slice(0, 200) || 'handout';

    if (!limited.includes('.')) {
      return limited;
    }

    const parts = limited.split('.');
    const extension = parts.pop();
    const namePortion = parts.join('.') || 'handout';
    const normalizedName = namePortion.slice(0, 150);
    const normalizedExtension = extension?.slice(0, 20);

    return `${normalizedName}.${normalizedExtension}`;
  }
}
