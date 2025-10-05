import { getSponsorPhotoUrl } from '../config/logo.js';
import { dbSponsor } from '../repositories/index.js';
import { SponsorType } from '@draco/shared-schemas';

export class SponsorResponseFormatter {
  static formatSponsor(sponsor: dbSponsor): SponsorType {
    return {
      id: sponsor.id.toString(),
      accountId: sponsor.accountid.toString(),
      teamId: sponsor.teamid ? sponsor.teamid.toString() : undefined,
      name: sponsor.name,
      streetAddress: sponsor.streetaddress || '',
      cityStateZip: sponsor.citystatezip || '',
      description: sponsor.description || '',
      email: sponsor.email || undefined,
      phone: sponsor.phone || undefined,
      fax: sponsor.fax || undefined,
      website: sponsor.website || undefined,
      photoUrl: getSponsorPhotoUrl(sponsor.accountid.toString(), sponsor.id.toString()),
    };
  }

  static formatSponsors(sponsors: dbSponsor[]): SponsorType[] {
    return sponsors.map((sponsor) => this.formatSponsor(sponsor));
  }
}
