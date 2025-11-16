import { MemberBusinessType } from '@draco/shared-schemas';
import { getContactPhotoUrl } from '../config/logo.js';
import { dbMemberBusiness } from '../repositories/index.js';

const normalize = (value: string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class MemberBusinessResponseFormatter {
  static format(memberBusiness: dbMemberBusiness): MemberBusinessType {
    return {
      id: memberBusiness.id.toString(),
      accountId: memberBusiness.contacts.creatoraccountid.toString(),
      name: memberBusiness.name,
      streetAddress: normalize(memberBusiness.streetaddress),
      cityStateZip: normalize(memberBusiness.citystatezip),
      description: normalize(memberBusiness.description),
      email: normalize(memberBusiness.email),
      phone: normalize(memberBusiness.phone),
      fax: normalize(memberBusiness.fax),
      website: normalize(memberBusiness.website),
      contact: {
        id: memberBusiness.contactid.toString(),
        firstName: memberBusiness.contacts.firstname,
        lastName: memberBusiness.contacts.lastname,
        photoUrl: normalize(
          getContactPhotoUrl(
            memberBusiness.contacts.creatoraccountid.toString(),
            memberBusiness.contactid.toString(),
          ),
        ),
      },
    } satisfies MemberBusinessType;
  }

  static formatMany(memberBusinesses: dbMemberBusiness[]): MemberBusinessType[] {
    return memberBusinesses.map((memberBusiness) => this.format(memberBusiness));
  }
}
