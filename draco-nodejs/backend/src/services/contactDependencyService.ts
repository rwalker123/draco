/**
 * Contact Dependency Service
 * Checks for foreign key dependencies before allowing contact deletion
 */

import prisma from '../lib/prisma.js';
import { ValidationError } from '../utils/customErrors.js';
import { ContactPhotoService } from './contactPhotoService.js';

export interface ContactDependency {
  table: string;
  count: number;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface DependencyCheckResult {
  canDelete: boolean;
  dependencies: ContactDependency[];
  message: string;
  totalDependencies: number;
}

/**
 * Configuration for contact dependency checks
 * Maps table names to their descriptions and risk levels
 */
const DEPENDENCY_CONFIG: Record<
  string,
  { description: string; riskLevel: ContactDependency['riskLevel'] }
> = {
  // Critical - Core player/user data
  roster: { description: 'Player records', riskLevel: 'critical' },
  rosterseason: { description: 'Season player data', riskLevel: 'critical' },
  contactroles: { description: 'Role assignments', riskLevel: 'critical' },

  // High - Sports data and participation
  golfroster: { description: 'Golf league participation', riskLevel: 'high' },
  golfscore: { description: 'Golf scoring data', riskLevel: 'high' },
  teamseasonmanager: { description: 'Team management assignments', riskLevel: 'high' },
  leagueumpires: { description: 'Umpire assignments', riskLevel: 'high' },
  hof: { description: 'Hall of Fame entries', riskLevel: 'high' },

  // Medium - Operational data
  fieldcontacts: { description: 'Field contact assignments', riskLevel: 'medium' },
  golfcourseforcontact: { description: 'Golf course preferences', riskLevel: 'medium' },
  golferstatsconfiguration: { description: 'Statistics configuration', riskLevel: 'medium' },
  golferstatsvalue: { description: 'Statistics values', riskLevel: 'medium' },
  memberbusiness: { description: 'Business listings', riskLevel: 'medium' },
  playerprofile: { description: 'Player profiles', riskLevel: 'medium' },

  // Low - Social/forum data
  messagepost: { description: 'Forum posts', riskLevel: 'low' },
  messagetopic: { description: 'Forum topics', riskLevel: 'low' },
  playerswantedclassified: { description: 'Classified ads', riskLevel: 'low' },
  voteanswers: { description: 'Poll responses', riskLevel: 'low' },
};

/**
 * Special case: Golf league officer positions
 * These require separate queries as they're not direct foreign keys to contactid
 */
const GOLF_OFFICER_POSITIONS = [
  { field: 'presidentid', description: 'League President' },
  { field: 'vicepresidentid', description: 'League Vice President' },
  { field: 'secretaryid', description: 'League Secretary' },
  { field: 'treasurerid', description: 'League Treasurer' },
];

export class ContactDependencyService {
  /**
   * Check all dependencies for a contact before deletion
   */
  static async checkDependencies(
    contactId: bigint,
    accountId: bigint,
  ): Promise<DependencyCheckResult> {
    const dependencies: ContactDependency[] = [];

    // First check if this contact is the account owner - this is a blocking condition
    const isAccountOwner = await this.checkIfAccountOwner(contactId, accountId);
    if (isAccountOwner) {
      return {
        canDelete: false,
        dependencies: [
          {
            table: 'accounts',
            count: 1,
            description: 'Account Owner',
            riskLevel: 'critical',
          },
        ],
        message: 'Cannot delete account owner. Account owners cannot be deleted.',
        totalDependencies: 1,
      };
    }

    // Check direct foreign key dependencies
    for (const [tableName, config] of Object.entries(DEPENDENCY_CONFIG)) {
      const count = await this.checkTableDependency(tableName, contactId);
      if (count > 0) {
        dependencies.push({
          table: tableName,
          count,
          description: config.description,
          riskLevel: config.riskLevel,
        });
      }
    }

    // Check golf league officer positions
    const officerDependencies = await this.checkGolfOfficerDependencies(contactId, accountId);
    dependencies.push(...officerDependencies);

    const totalDependencies = dependencies.reduce((sum, dep) => sum + dep.count, 0);
    const canDelete = totalDependencies === 0;

    const message = canDelete
      ? 'Contact can be safely deleted'
      : `Contact has ${totalDependencies} dependencies. Use force=true to delete anyway.`;

    return {
      canDelete,
      dependencies,
      message,
      totalDependencies,
    };
  }

  /**
   * Check if the contact is the account owner
   */
  private static async checkIfAccountOwner(contactId: bigint, accountId: bigint): Promise<boolean> {
    try {
      // Get the contact's userid
      const contact = await prisma.contacts.findFirst({
        where: {
          id: contactId,
          creatoraccountid: accountId,
        },
        select: {
          userid: true,
        },
      });

      if (!contact?.userid) {
        return false; // Contact has no associated user, so can't be account owner
      }

      // Check if this userid is the owner of the account
      const account = await prisma.accounts.findFirst({
        where: {
          id: accountId,
          owneruserid: contact.userid,
        },
      });

      return !!account; // Returns true if account found with this user as owner
    } catch (error) {
      console.error('Error checking if contact is account owner:', error);
      return false; // Err on the side of caution - if we can't check, don't block
    }
  }

  /**
   * Check dependency count for a specific table
   */
  private static async checkTableDependency(tableName: string, contactId: bigint): Promise<number> {
    try {
      // Use Prisma's dynamic model access
      const model = (
        prisma as unknown as Record<
          string,
          { count: (args: { where: Record<string, unknown> }) => Promise<number> }
        >
      )[tableName];
      if (!model) {
        console.warn(`Table ${tableName} not found in Prisma client`);
        return 0;
      }

      // Most tables use 'contactid', but some use different field names
      const contactField = this.getContactFieldName(tableName);

      const count = await model.count({
        where: {
          [contactField]: contactId,
        },
      });

      return count;
    } catch (error) {
      console.error(`Error checking ${tableName} dependencies:`, error);
      return 0;
    }
  }

  /**
   * Check golf league officer dependencies
   */
  private static async checkGolfOfficerDependencies(
    contactId: bigint,
    accountId: bigint,
  ): Promise<ContactDependency[]> {
    const dependencies: ContactDependency[] = [];

    try {
      for (const position of GOLF_OFFICER_POSITIONS) {
        const count = await prisma.golfleaguesetup.count({
          where: {
            [position.field]: contactId,
            accountid: accountId,
          },
        });

        if (count > 0) {
          dependencies.push({
            table: 'golfleaguesetup',
            count,
            description: position.description,
            riskLevel: 'critical',
          });
        }
      }
    } catch (error) {
      console.error('Error checking golf officer dependencies:', error);
    }

    return dependencies;
  }

  /**
   * Get the correct contact field name for each table
   */
  private static getContactFieldName(tableName: string): string {
    const fieldMappings: Record<string, string> = {
      messagepost: 'contactcreatorid',
      messagetopic: 'contactcreatorid',
      playerprofile: 'playerid',
      playerswantedclassified: 'createdbycontactid',
    };

    return fieldMappings[tableName] || 'contactid';
  }

  /**
   * Force delete a contact and all dependencies
   * WARNING: This will delete all related data
   */
  static async forceDeleteContact(contactId: bigint, accountId: bigint): Promise<void> {
    // Even with force=true, never allow deleting the account owner
    const isAccountOwner = await this.checkIfAccountOwner(contactId, accountId);
    if (isAccountOwner) {
      throw new ValidationError(
        'Cannot delete account owner. Account owners cannot be deleted even with force=true.',
      );
    }

    try {
      // Delete associated photo before deleting the contact
      await ContactPhotoService.deleteContactPhoto(contactId, accountId);

      // Since all dependencies have CASCADE delete configured in the schema,
      // we can simply delete the contact and let the database handle cascading
      await prisma.contacts.delete({
        where: {
          id: contactId,
          creatoraccountid: accountId, // Ensure account boundary
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new ValidationError('Contact not found or does not belong to this account');
      }
      throw error;
    }
  }

  /**
   * Safe delete - only delete if no dependencies exist
   */
  static async safeDeleteContact(contactId: bigint, accountId: bigint): Promise<boolean> {
    const dependencyCheck = await this.checkDependencies(contactId, accountId);

    if (!dependencyCheck.canDelete) {
      throw new ValidationError(`Cannot delete contact: ${dependencyCheck.message}`);
    }

    await this.forceDeleteContact(contactId, accountId);
    return true;
  }
}
