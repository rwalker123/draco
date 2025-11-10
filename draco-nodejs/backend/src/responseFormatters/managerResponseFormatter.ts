import { TeamManagerType } from '@draco/shared-schemas';
import { dbTeamManagerWithContact } from '../repositories/index.js';
import { getContactPhotoUrl } from '../config/logo.js';

export class ManagerResponseFormatter {
  static formatManagersListResponse(rawManagers: dbTeamManagerWithContact[]): TeamManagerType[] {
    return rawManagers.map((manager) => {
      const creatorAccountId = manager.contacts.creatoraccountid
        ? manager.contacts.creatoraccountid.toString()
        : undefined;

      return {
        id: manager.id.toString(),
        team: {
          id: manager.teamseasonid.toString(),
        },
        contact: {
          id: manager.contacts.id.toString(),
          userId: manager.contacts.userid || undefined,
          firstName: manager.contacts.firstname,
          lastName: manager.contacts.lastname,
          middleName: manager.contacts.middlename || '',
          email: manager.contacts.email || undefined,
          photoUrl:
            creatorAccountId !== undefined
              ? getContactPhotoUrl(creatorAccountId, manager.contacts.id.toString())
              : undefined,
          contactDetails: formatContactDetails(manager.contacts),
        },
      };
    });
  }

  static formatAddManagerResponse(rawManager: dbTeamManagerWithContact): TeamManagerType {
    const creatorAccountId = rawManager.contacts.creatoraccountid
      ? rawManager.contacts.creatoraccountid.toString()
      : undefined;

    return {
      id: rawManager.id.toString(),
      team: {
        id: rawManager.teamseasonid.toString(),
      },
      contact: {
        id: rawManager.contacts.id.toString(),
        userId: rawManager.contacts.userid || undefined,
        firstName: rawManager.contacts.firstname,
        lastName: rawManager.contacts.lastname,
        middleName: rawManager.contacts.middlename || '',
        email: rawManager.contacts.email || undefined,
        photoUrl:
          creatorAccountId !== undefined
            ? getContactPhotoUrl(creatorAccountId, rawManager.contacts.id.toString())
            : undefined,
        contactDetails: formatContactDetails(rawManager.contacts),
      },
    };
  }
}

const formatContactDetails = (contact: dbTeamManagerWithContact['contacts']) => ({
  phone1: contact.phone1 || '',
  phone2: contact.phone2 || '',
  phone3: contact.phone3 || '',
  streetAddress: contact.streetaddress || '',
  city: contact.city || '',
  state: contact.state || '',
  zip: contact.zip || '',
  dateOfBirth: contact.dateofbirth?.toISOString() || '',
});
