export interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

export const formatContactName = (contact: ContactOption): string =>
  `${contact.firstName} ${contact.lastName}`.trim();
