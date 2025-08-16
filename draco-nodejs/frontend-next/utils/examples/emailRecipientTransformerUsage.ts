/**
 * Example usage of Email Recipient Transformation Utilities
 *
 * This file demonstrates how to use the transformation utilities to convert
 * backend API responses into frontend component types for the AdvancedRecipientDialog.
 */

import { createEmailRecipientService } from '../../services/emailRecipientService';
import {
  transformBackendContact,
  transformContactsToRoleGroups,
  transformTeamsToGroups,
  deduplicateContacts,
  validateContactCollection,
  filterContactsByQuery,
  sortContactsByDisplayName,
} from '../emailRecipientTransformers';

/**
 * Example: Loading and transforming recipient data for email composition
 */
export async function loadRecipientData(accountId: string, token: string) {
  // 1. Create service instance
  const recipientService = createEmailRecipientService();

  // 2. Fetch comprehensive recipient data (service handles transformation internally)
  const recipientDataResult = await recipientService.getRecipientData(accountId, token);

  // 3. Check if the request was successful
  if (!recipientDataResult.success) {
    console.error('Failed to fetch recipient data:', recipientDataResult.error.userMessage);
    return;
  }

  // 4. The service returns already transformed data, but you can apply additional processing
  const { contacts, teamGroups, roleGroups, currentSeason } = recipientDataResult.data;

  // 5. Optional: Apply additional filters or sorting
  const searchQuery = 'john'; // Example search
  const filteredContacts = filterContactsByQuery(contacts, searchQuery);
  const sortedContacts = sortContactsByDisplayName(filteredContacts);

  // 5. Get validation metrics for UI feedback
  const validation = validateContactCollection(contacts);

  console.log('Recipient Data Summary:', {
    totalContacts: validation.totalContacts,
    validEmails: validation.validEmailCount,
    invalidEmails: validation.invalidEmailCount,
    teamGroups: teamGroups.length,
    roleGroups: roleGroups.length,
    currentSeason: currentSeason?.name || 'No active season',
    dataQualityIssues: validation.dataQualityIssues,
  });

  return {
    contacts: sortedContacts,
    allContacts: contacts,
    teamGroups,
    roleGroups,
    validation,
    currentSeason,
  };
}

/**
 * Example: Manual transformation of backend contact data
 */
export function transformRawContactData(backendContacts: unknown[]) {
  // 1. Transform backend contacts to frontend format
  const transformedContacts = backendContacts.map(transformBackendContact);

  // 2. Remove duplicates
  const uniqueContacts = deduplicateContacts(transformedContacts);

  // 3. Create role groups from contacts
  const roleGroups = transformContactsToRoleGroups(uniqueContacts);

  // 4. Validate data quality
  const validation = validateContactCollection(uniqueContacts);

  return {
    contacts: uniqueContacts,
    roleGroups,
    validation,
  };
}

/**
 * Example: Building team groups manually
 */
export function buildTeamGroupsManually(
  teams: unknown[],
  rostersMap: Map<string, unknown[]>,
  managersMap: Map<string, unknown[]>,
) {
  // Transform team data with rosters and managers
  const teamGroups = transformTeamsToGroups(teams, rostersMap, managersMap);

  // Group by team type for UI organization
  const groupedByType = {
    players: teamGroups.filter((g) => g.type === 'players'),
    managers: teamGroups.filter((g) => g.type === 'managers'),
    all: teamGroups.filter((g) => g.type === 'all'),
    sports: teamGroups.filter((g) => g.type === 'sports'),
  };

  return { teamGroups, groupedByType };
}

/**
 * Example: Search and filter functionality
 */
export function searchAndFilterContacts(
  contacts: unknown[],
  searchQuery: string,
  options: {
    sortByName?: boolean;
    validEmailsOnly?: boolean;
    maxResults?: number;
  } = {},
) {
  let results = contacts;

  // Apply search filter
  if (searchQuery.trim()) {
    results = filterContactsByQuery(results, searchQuery);
  }

  // Filter by valid emails only
  if (options.validEmailsOnly) {
    results = results.filter((contact) => contact.hasValidEmail);
  }

  // Sort by display name
  if (options.sortByName) {
    results = sortContactsByDisplayName(results);
  }

  // Limit results
  if (options.maxResults && options.maxResults > 0) {
    results = results.slice(0, options.maxResults);
  }

  return results;
}

/**
 * Example: Data quality reporting
 */
export function generateDataQualityReport(contacts: unknown[]) {
  const validation = validateContactCollection(contacts);

  const report = {
    summary: {
      totalContacts: validation.totalContacts,
      validEmails: validation.validEmailCount,
      invalidEmails: validation.invalidEmailCount,
      emailValidationRate: Math.round(
        (validation.validEmailCount / validation.totalContacts) * 100,
      ),
      duplicates: validation.duplicateCount,
    },
    issues: validation.dataQualityIssues,
    recommendations: [] as string[],
  };

  // Generate recommendations
  if (validation.invalidEmailCount > 0) {
    report.recommendations.push(
      `Consider updating ${validation.invalidEmailCount} contact(s) with missing or invalid email addresses`,
    );
  }

  if (validation.duplicateCount > 0) {
    report.recommendations.push(
      `Review and merge ${validation.duplicateCount} duplicate contact(s)`,
    );
  }

  if (report.summary.emailValidationRate < 80) {
    report.recommendations.push(
      'Email validation rate is below 80%. Consider a data cleanup initiative.',
    );
  }

  return report;
}
