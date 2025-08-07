import { Contact, ContactRole, ContactDetails } from '../types/users';
import { ContactUpdateResponse } from '../types/typeGuards';
import { getRoleDisplayName } from '../utils/roleUtils';

/**
 * Contact Transformation Service
 * Centralized service for transforming contact data between backend and frontend formats
 * Follows DRY principles by providing shared transformation logic
 */
export class ContactTransformationService {
  /**
   * Transform backend contact data (with flexible field naming) to frontend Contact format
   * Handles both camelCase and lowercase field names from different backend endpoints
   */
  static transformBackendContact(backendContact: Record<string, unknown>): Contact {
    return {
      id: (backendContact.id as string) || '',
      firstName: (backendContact.firstname as string) || (backendContact.firstName as string) || '',
      lastName: (backendContact.lastname as string) || (backendContact.lastName as string) || '',
      middleName:
        (backendContact.middleName as string) || (backendContact.middlename as string) || null,
      email: (backendContact.email as string) || '',
      userId: (backendContact.userId as string) || '',
      photoUrl: backendContact.photoUrl as string | undefined,
      contactDetails: this.transformContactDetails(backendContact),
      contactroles: (backendContact.contactroles as ContactRole[]) || [],
    };
  }

  /**
   * Transform ContactUpdateResponse (backend format) to Contact (frontend format)
   * Used for API responses from contact update/create operations
   */
  static transformContactUpdateResponse(response: ContactUpdateResponse): Contact {
    return {
      id: response.id,
      firstName: response.firstname,
      lastName: response.lastname,
      middleName: response.middlename || null, // ✅ Use middlename from response
      email: response.email || '',
      userId: '', // Not provided in ContactUpdateResponse
      photoUrl: response.photoUrl || undefined,
      contactDetails: {
        phone1: response.phone1 || null,
        phone2: response.phone2 || null,
        phone3: response.phone3 || null,
        streetaddress: response.streetaddress || null,
        city: response.city || null,
        state: response.state || null,
        zip: response.zip || null,
        dateofbirth: response.dateofbirth || null,
        // ❌ Removed: middlename (moved to top-level middleName)
      },
      contactroles: [], // Not provided in ContactUpdateResponse
    };
  }

  /**
   * Transform Contact to User format
   * Shared transformation logic for converting Contact objects to User objects
   */
  static transformContactToUser(contact: Contact) {
    const transformedRoles =
      contact.contactroles?.map((cr: ContactRole) => ({
        id: cr.id,
        roleId: cr.roleId,
        roleName: cr.roleName || getRoleDisplayName(cr.roleId),
        roleData: cr.roleData,
        contextName: cr.contextName,
      })) || [];

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      middleName: contact.middleName,
      email: contact.email,
      userId: contact.userId,
      photoUrl: contact.photoUrl,
      contactDetails: contact.contactDetails,
      roles: transformedRoles,
    };
  }

  /**
   * Helper method to transform contact details from backend format
   * Handles nested contact details from various backend response formats
   */
  private static transformContactDetails(backendContact: Record<string, unknown>): ContactDetails {
    // Handle case where contact details are nested in a contactDetails object
    const nestedDetails = backendContact.contactDetails as Record<string, unknown> | undefined;

    if (nestedDetails) {
      return {
        phone1: (nestedDetails.phone1 as string) || null,
        phone2: (nestedDetails.phone2 as string) || null,
        phone3: (nestedDetails.phone3 as string) || null,
        streetaddress: (nestedDetails.streetaddress as string) || null,
        city: (nestedDetails.city as string) || null,
        state: (nestedDetails.state as string) || null,
        zip: (nestedDetails.zip as string) || null,
        dateofbirth: (nestedDetails.dateofbirth as string) || null,
        // ❌ Removed: middlename (moved to top-level middleName)
      };
    }

    // Handle case where contact details are at the top level
    return {
      phone1: (backendContact.phone1 as string) || null,
      phone2: (backendContact.phone2 as string) || null,
      phone3: (backendContact.phone3 as string) || null,
      streetaddress: (backendContact.streetaddress as string) || null,
      city: (backendContact.city as string) || null,
      state: (backendContact.state as string) || null,
      zip: (backendContact.zip as string) || null,
      dateofbirth: (backendContact.dateofbirth as string) || null,
      // ❌ Removed: middlename (moved to top-level middleName)
    };
  }
}
