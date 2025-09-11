import axios from 'axios';
import { axiosInstance } from '../utils/axiosConfig';
import { ContactUpdateData, Contact } from '../types/users';
import { RosterFormData, RosterMember, TeamRosterData, ManagerType } from '../types/roster';
import { UserManagementService } from './userManagementService';
import { addCacheBuster } from '../config/contacts';

// Error detail interface for validation errors
interface ErrorDetail {
  msg: string;
  param?: string;
  location?: string;
}

// Backend contact input format (updated to use middleName)
interface ContactInputData {
  firstname?: string;
  lastname?: string;
  middleName?: string; // ✅ Updated to use middleName instead of middlename
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth?: string;
}

// Request body for creating contact with roster data
interface CreateContactRequestBody {
  contactId?: string;
  contactData?: ContactInputData;
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

// Operation result types
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rollback?: () => void;
}

// Optimistic update functions
export interface OptimisticUpdate<T> {
  apply: (currentData: T) => T;
  rollback: (currentData: T) => T;
}

export class RosterOperationsService {
  // Helper method to handle errors consistently
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const fieldErrors = error.response.data.details
          .map((detail: ErrorDetail) => detail.msg)
          .join(', ');
        return `Validation error: ${fieldErrors}`;
      }
      return error.response?.data?.message || error.message || 'Operation failed';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Operation failed';
  }
  private userManagementService: UserManagementService;

  constructor(token: string) {
    this.userManagementService = new UserManagementService(token);
  }

  // Generic optimistic operation handler
  private async executeOptimisticOperation<T>(
    currentData: T,
    optimisticUpdate: OptimisticUpdate<T>,
    apiOperation: () => Promise<{ data: { success: boolean; message?: string; data?: unknown } }>,
  ): Promise<OperationResult<T>> {
    try {
      // Apply optimistic update immediately
      const optimisticData = optimisticUpdate.apply(currentData);

      // Execute API operation
      const response = await apiOperation();

      if (response.data.success) {
        return {
          success: true,
          data: optimisticData,
        };
      } else {
        // Rollback on API failure
        const rollbackData = optimisticUpdate.rollback(optimisticData);
        return {
          success: false,
          error: response.data.message || 'Operation failed',
          data: rollbackData,
        };
      }
    } catch (error: unknown) {
      // Rollback on error
      const rollbackData = optimisticUpdate.rollback(currentData);

      const errorMessage = this.getErrorMessage(error);

      return {
        success: false,
        error: errorMessage,
        data: rollbackData,
      };
    }
  }

  // Update roster member information
  async updateRosterMember(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    rosterMemberId: string,
    updates: Partial<RosterFormData>,
    currentRosterData: TeamRosterData,
  ): Promise<OperationResult<TeamRosterData>> {
    const optimisticUpdate: OptimisticUpdate<TeamRosterData> = {
      apply: (data) => ({
        ...data,
        rosterMembers: data.rosterMembers.map((member) =>
          member.id === rosterMemberId
            ? {
                ...member,
                playerNumber: updates.playerNumber ?? member.playerNumber,
                submittedWaiver: updates.submittedWaiver ?? member.submittedWaiver,
                player: {
                  ...member.player,
                  submittedDriversLicense:
                    updates.submittedDriversLicense ?? member.player.submittedDriversLicense,
                  firstYear: updates.firstYear ?? member.player.firstYear,
                },
              }
            : member,
        ),
      }),
      rollback: (_data) => currentRosterData, // Return original data
    };

    return this.executeOptimisticOperation(currentRosterData, optimisticUpdate, () =>
      axiosInstance.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMemberId}`,
        updates,
      ),
    );
  }

  // Update contact information - delegates to UserManagementService for consistency
  async updateContact(
    accountId: string,
    contactId: string,
    contactData: ContactUpdateData,
    currentRosterData: TeamRosterData,
    photoFile?: File | null,
  ): Promise<OperationResult<TeamRosterData>> {
    try {
      // Make API call first to get updated contact data including photo URL
      const updatedContactData = await this.userManagementService.updateContact(
        accountId,
        contactId,
        contactData,
        photoFile,
      );

      // Apply the update with the actual API response data
      const updatedRosterData: TeamRosterData = {
        ...currentRosterData,
        rosterMembers: currentRosterData.rosterMembers.map((member) =>
          member.player.contactId === contactId
            ? {
                ...member,
                player: {
                  ...member.player,
                  contact: {
                    ...member.player.contact,
                    firstName: updatedContactData.firstName || member.player.contact.firstName,
                    lastName: updatedContactData.lastName || member.player.contact.lastName,
                    email: updatedContactData.email || member.player.contact.email,
                    // Apply cache busting to photo URL if present to force browser refresh
                    photoUrl: updatedContactData.photoUrl
                      ? addCacheBuster(updatedContactData.photoUrl, Date.now())
                      : undefined,
                    contactDetails: {
                      ...member.player.contact.contactDetails,
                      phone1:
                        updatedContactData.contactDetails?.phone1 ??
                        member.player.contact.contactDetails?.phone1 ??
                        null,
                      phone2:
                        updatedContactData.contactDetails?.phone2 ??
                        member.player.contact.contactDetails?.phone2 ??
                        null,
                      phone3:
                        updatedContactData.contactDetails?.phone3 ??
                        member.player.contact.contactDetails?.phone3 ??
                        null,
                      streetaddress:
                        updatedContactData.contactDetails?.streetaddress ??
                        member.player.contact.contactDetails?.streetaddress ??
                        null,
                      city:
                        updatedContactData.contactDetails?.city ??
                        member.player.contact.contactDetails?.city ??
                        null,
                      state:
                        updatedContactData.contactDetails?.state ??
                        member.player.contact.contactDetails?.state ??
                        null,
                      zip:
                        updatedContactData.contactDetails?.zip ??
                        member.player.contact.contactDetails?.zip ??
                        null,
                      dateofbirth:
                        updatedContactData.contactDetails?.dateofbirth ??
                        member.player.contact.contactDetails?.dateofbirth ??
                        null,
                    },
                  },
                },
              }
            : member,
        ),
      };

      return {
        success: true,
        data: updatedRosterData,
      };
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);

      return {
        success: false,
        error: errorMessage,
        data: currentRosterData, // Return original data on error
      };
    }
  }

  // Sign player to roster
  async signPlayer(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    contactId: string,
    rosterData: RosterFormData,
    currentRosterData: TeamRosterData,
    availablePlayers: Contact[],
  ): Promise<OperationResult<{ rosterData: TeamRosterData; availablePlayers: Contact[] }>> {
    const player = availablePlayers.find((p) => p.id === contactId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found',
      };
    }

    try {
      // Make API call and wait for response (no optimistic updates)
      const response = await axiosInstance.post(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        {
          contactId,
          playerNumber: rosterData.playerNumber,
          submittedWaiver: rosterData.submittedWaiver,
          submittedDriversLicense: rosterData.submittedDriversLicense,
          firstYear: rosterData.firstYear,
        },
      );

      if (!response.data.success) {
        return {
          success: false,
          error: response.data.message || 'Failed to sign player',
        };
      }

      // Transform the server response to the expected format
      const serverRosterMember = response.data.data;
      const newRosterMember: RosterMember = {
        id: serverRosterMember.id.toString(),
        playerNumber: serverRosterMember.playerNumber,
        inactive: serverRosterMember.inactive,
        submittedWaiver: serverRosterMember.submittedWaiver,
        dateAdded: serverRosterMember.dateAdded || new Date().toISOString(),
        player: {
          id: serverRosterMember.player.id.toString(),
          contactId: serverRosterMember.player.contactId.toString(),
          submittedDriversLicense: serverRosterMember.player.submittedDriversLicense,
          firstYear: serverRosterMember.player.firstYear,
          contact: serverRosterMember.player.contact,
        },
      };

      // Update roster data with the new member
      const updatedRosterData = {
        ...currentRosterData,
        rosterMembers: [...currentRosterData.rosterMembers, newRosterMember],
      };

      // Remove the player from available players
      const updatedAvailablePlayers = availablePlayers.filter((p) => p.id !== contactId);

      return {
        success: true,
        data: {
          rosterData: updatedRosterData,
          availablePlayers: updatedAvailablePlayers,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Release player
  async releasePlayer(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    rosterMemberId: string,
    currentRosterData: TeamRosterData,
  ): Promise<OperationResult<TeamRosterData>> {
    const optimisticUpdate: OptimisticUpdate<TeamRosterData> = {
      apply: (data) => ({
        ...data,
        rosterMembers: data.rosterMembers.map((member) =>
          member.id === rosterMemberId ? { ...member, inactive: true } : member,
        ),
      }),
      rollback: (_data) => currentRosterData,
    };

    return this.executeOptimisticOperation(currentRosterData, optimisticUpdate, () =>
      axiosInstance.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMemberId}/release`,
        {},
      ),
    );
  }

  // Activate player
  async activatePlayer(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    rosterMemberId: string,
    currentRosterData: TeamRosterData,
  ): Promise<OperationResult<TeamRosterData>> {
    const optimisticUpdate: OptimisticUpdate<TeamRosterData> = {
      apply: (data) => ({
        ...data,
        rosterMembers: data.rosterMembers.map((member) =>
          member.id === rosterMemberId ? { ...member, inactive: false } : member,
        ),
      }),
      rollback: (_data) => currentRosterData,
    };

    return this.executeOptimisticOperation(currentRosterData, optimisticUpdate, () =>
      axiosInstance.put(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMemberId}/activate`,
        {},
      ),
    );
  }

  // Delete player
  async deletePlayer(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    rosterMemberId: string,
    currentRosterData: TeamRosterData,
  ): Promise<OperationResult<TeamRosterData>> {
    const optimisticUpdate: OptimisticUpdate<TeamRosterData> = {
      apply: (data) => ({
        ...data,
        rosterMembers: data.rosterMembers.filter((member) => member.id !== rosterMemberId),
      }),
      rollback: (_data) => currentRosterData,
    };

    return this.executeOptimisticOperation(currentRosterData, optimisticUpdate, () =>
      axiosInstance.delete(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster/${rosterMemberId}`,
      ),
    );
  }

  // Add manager
  async addManager(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    contactId: string,
    currentManagers: ManagerType[],
  ): Promise<OperationResult<ManagerType[]>> {
    try {
      // Make API call and wait for response (no optimistic updates)
      const response = await axiosInstance.post(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers`,
        { contactId },
      );

      if (!response.data.success) {
        return {
          success: false,
          error: response.data.message || 'Failed to add manager',
        };
      }

      // The backend now returns properly formatted data with camelCase and nested contact
      const newManager: ManagerType = response.data.data;

      // Update managers list with the new manager
      const updatedManagers = [...currentManagers, newManager];

      return {
        success: true,
        data: updatedManagers,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Remove manager
  async removeManager(
    accountId: string,
    seasonId: string,
    teamSeasonId: string,
    managerId: string,
    currentManagers: ManagerType[],
  ): Promise<OperationResult<ManagerType[]>> {
    const optimisticUpdate: OptimisticUpdate<ManagerType[]> = {
      apply: (data) => data.filter((manager) => manager.id !== managerId),
      rollback: (_data) => currentManagers,
    };

    return this.executeOptimisticOperation(currentManagers, optimisticUpdate, () =>
      axiosInstance.delete(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers/${managerId}`,
      ),
    );
  }

  // Create new contact and optionally sign to roster - uses enhanced addPlayerToRoster endpoint
  async createContact(
    accountId: string,
    contactData: ContactUpdateData,
    photoFile?: File | null,
    autoSignToRoster?: boolean,
    seasonId?: string,
    teamSeasonId?: string,
  ): Promise<OperationResult<{ contact: Contact; rosterMember?: RosterMember }>> {
    try {
      // If photo is provided, we need to handle it separately since the roster endpoint doesn't support file upload
      if (photoFile) {
        // Create contact first with photo
        const contactResponse = await this.userManagementService.createContact(
          accountId,
          contactData,
          photoFile,
        );

        // Then use the existing contact ID for roster assignment if requested
        if (autoSignToRoster && seasonId && teamSeasonId) {
          const requestBody: CreateContactRequestBody = {
            contactId: contactResponse.id,
            playerNumber: 0,
            submittedWaiver: false,
            submittedDriversLicense: false,
            firstYear: 0,
          };

          const rosterResponse = await axiosInstance.post(
            `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
            requestBody,
          );

          if (!rosterResponse.data.success) {
            return {
              success: false,
              error: rosterResponse.data.message || 'Failed to add contact to roster',
            };
          }

          const rosterMember = rosterResponse.data.data;

          return {
            success: true,
            data: {
              contact: contactResponse,
              rosterMember: {
                id: rosterMember.id?.toString() || '',
                playerNumber: rosterMember.playerNumber || 0,
                inactive: rosterMember.inactive || false,
                submittedWaiver: rosterMember.submittedWaiver || false,
                dateAdded: rosterMember.dateAdded?.toISOString() || new Date().toISOString(),
                player: {
                  id: rosterMember.player?.id?.toString() || '',
                  contactId: rosterMember.player?.contactId?.toString() || contactResponse.id,
                  submittedDriversLicense: rosterMember.player?.submittedDriversLicense || false,
                  firstYear: rosterMember.player?.firstYear || 0,
                  contact: contactResponse,
                },
              },
            },
          };
        } else {
          // Just return the contact without roster info
          return {
            success: true,
            data: {
              contact: contactResponse,
            },
          };
        }
      }

      // Transform ContactUpdateData to ContactInputData format for backend
      const contactInputData: ContactInputData = {};

      if (contactData.firstName) contactInputData.firstname = contactData.firstName;
      if (contactData.lastName) contactInputData.lastname = contactData.lastName;
      if (contactData.middleName !== undefined)
        contactInputData.middleName = contactData.middleName;
      if (contactData.email !== undefined) contactInputData.email = contactData.email;
      if (contactData.phone1 !== undefined) contactInputData.phone1 = contactData.phone1;
      if (contactData.phone2 !== undefined) contactInputData.phone2 = contactData.phone2;
      if (contactData.phone3 !== undefined) contactInputData.phone3 = contactData.phone3;
      if (contactData.streetaddress !== undefined)
        contactInputData.streetaddress = contactData.streetaddress;
      if (contactData.city !== undefined) contactInputData.city = contactData.city;
      if (contactData.state !== undefined) contactInputData.state = contactData.state;
      if (contactData.zip !== undefined) contactInputData.zip = contactData.zip;
      if (contactData.dateofbirth !== undefined && contactData.dateofbirth !== null)
        contactInputData.dateofbirth = contactData.dateofbirth;

      // Prepare request body for the enhanced endpoint (contact creation + roster assignment)
      const requestBody: CreateContactRequestBody = {
        contactData: contactInputData,
        playerNumber: 0,
        submittedWaiver: false,
        submittedDriversLicense: false,
        firstYear: 0,
      };

      // Use the enhanced addPlayerToRoster endpoint that can create contact and add to roster in one call
      const response = await axiosInstance.post(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        requestBody,
      );

      if (!response.data.success) {
        return {
          success: false,
          error: response.data.message || 'Failed to create contact and add to roster',
        };
      }

      const rosterMember = response.data.data;

      // Add logging to see the actual response structure
      console.log('createContact: Response structure:', JSON.stringify(rosterMember, null, 2));

      // Check if the response has the expected structure
      if (!rosterMember?.player?.contact) {
        console.error('createContact: Missing contact data in response:', rosterMember);
        return {
          success: false,
          error: 'Invalid response structure - missing contact data',
        };
      }

      // Transform the response to match expected format with proper null checks
      const contact: Contact = {
        id: rosterMember.player.contact.id?.toString() || '',
        firstName:
          rosterMember.player.contact.firstName || rosterMember.player.contact.firstname || '',
        lastName:
          rosterMember.player.contact.lastName || rosterMember.player.contact.lastname || '',
        middleName:
          rosterMember.player.contact.middleName || rosterMember.player.contact.middlename || null,
        email: rosterMember.player.contact.email || '',
        userId: rosterMember.player.contact.userId || '',
        photoUrl: rosterMember.player.contact.photoUrl,
        contactDetails: rosterMember.player.contact.contactDetails || {
          phone1: null,
          phone2: null,
          phone3: null,
          streetaddress: null,
          city: null,
          state: null,
          zip: null,
          dateofbirth: null,
          // ❌ Removed: middlename: null (moved to top-level middleName)
        },
        contactroles: rosterMember.player.contact.contactroles || [],
      };

      return {
        success: true,
        data: {
          contact,
          rosterMember: {
            id: rosterMember.id?.toString() || '',
            playerNumber: rosterMember.playerNumber || 0,
            inactive: rosterMember.inactive || false,
            submittedWaiver: rosterMember.submittedWaiver || false,
            dateAdded: rosterMember.dateAdded?.toISOString() || new Date().toISOString(),
            player: {
              id: rosterMember.player.id?.toString() || '',
              contactId: rosterMember.player.contactId?.toString() || '',
              submittedDriversLicense: rosterMember.player.submittedDriversLicense || false,
              firstYear: rosterMember.player.firstYear || 0,
              contact,
            },
          },
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Delete contact photo
  async deleteContactPhoto(
    accountId: string,
    contactId: string,
    currentRosterData: TeamRosterData,
  ): Promise<OperationResult<TeamRosterData>> {
    const optimisticUpdate: OptimisticUpdate<TeamRosterData> = {
      apply: (data) => ({
        ...data,
        rosterMembers: data.rosterMembers.map((member) =>
          member.player.contactId === contactId
            ? {
                ...member,
                player: {
                  ...member.player,
                  contact: {
                    ...member.player.contact,
                    photoUrl: undefined,
                  },
                },
              }
            : member,
        ),
      }),
      rollback: (_data) => currentRosterData,
    };

    return this.executeOptimisticOperation(currentRosterData, optimisticUpdate, () =>
      axiosInstance.delete(`/api/accounts/${accountId}/contacts/${contactId}/photo`),
    );
  }
}
