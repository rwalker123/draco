import { TeamManagerType } from '@draco/shared-schemas';
import { dbTeamManagerWithContact } from '../repositories/index.js';

export class ManagerResponseFormatter {
  static formatManagersListResponse(rawManagers: dbTeamManagerWithContact[]): TeamManagerType[] {
    return rawManagers.map((manager) => ({
      id: manager.id.toString(),
      team: {
        id: manager.teamseasonid.toString(),
      },
      contact: {
        id: manager.contacts.id.toString(),
        creatoraccountid: '',
        userId: manager.contacts.userid || undefined,
        firstName: manager.contacts.firstname,
        lastName: manager.contacts.lastname,
        middleName: manager.contacts.middlename || '',
        email: manager.contacts.email || undefined,
        contactroles: [],
      },
    }));
  }

  static formatAddManagerResponse(rawManager: dbTeamManagerWithContact): TeamManagerType {
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
      },
    };
  }
}
