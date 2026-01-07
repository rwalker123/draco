import { contacts } from '#prisma/client';
import {
  GolfLeagueSetupType,
  NamedContactType,
  AbsentPlayerModeType,
  FullTeamAbsentModeType,
} from '@draco/shared-schemas';
import {
  GolfLeagueSetupWithOfficers,
  GolfAccountInfo,
} from '../repositories/interfaces/IGolfLeagueRepository.js';
import { AbsentPlayerMode, FullTeamAbsentMode } from '../utils/golfConstants.js';

export type GolfAccountInfoResponse = {
  id: string;
  name: string;
  accountTypeName: string;
  hasGolfSetup: boolean;
};

export class GolfLeagueResponseFormatter {
  private static formatContact(contact: contacts | null): NamedContactType | undefined {
    if (!contact) {
      return undefined;
    }

    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename ?? undefined,
    };
  }

  private static formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private static mapAbsentPlayerMode(mode: number): AbsentPlayerModeType {
    const modes: Record<number, AbsentPlayerModeType> = {
      [AbsentPlayerMode.OPPONENT_WINS]: 'opponentWins',
      [AbsentPlayerMode.HANDICAP_PENALTY]: 'handicapPenalty',
      [AbsentPlayerMode.SKIP_PAIRING]: 'skipPairing',
    };
    return modes[mode] ?? 'opponentWins';
  }

  private static mapFullTeamAbsentMode(mode: number): FullTeamAbsentModeType {
    const modes: Record<number, FullTeamAbsentModeType> = {
      [FullTeamAbsentMode.FORFEIT]: 'forfeit',
      [FullTeamAbsentMode.HANDICAP_PENALTY]: 'handicapPenalty',
    };
    return modes[mode] ?? 'forfeit';
  }

  static format(setup: GolfLeagueSetupWithOfficers, accountId?: bigint): GolfLeagueSetupType {
    return {
      id: setup.id.toString(),
      accountId: accountId?.toString() ?? setup.accountid.toString(),
      seasonId: setup.leagueseason?.seasonid.toString() ?? '',
      leagueSeasonId: setup.leagueseasonid?.toString() ?? '',
      leagueDay: setup.leagueday,
      firstTeeTime: this.formatTime(setup.firstteetime),
      timeBetweenTeeTimes: setup.timebetweenteetimes,
      holesPerMatch: setup.holespermatch,
      teeOffFormat: setup.teeoffformat,
      teamSize: setup.leagueseason?.golfseasonconfig?.teamsize ?? 2,
      president: this.formatContact(setup.contacts_golfleaguesetup_presidentidTocontacts),
      vicePresident: this.formatContact(setup.contacts_golfleaguesetup_vicepresidentidTocontacts),
      secretary: this.formatContact(setup.contacts_golfleaguesetup_secretaryidTocontacts),
      treasurer: this.formatContact(setup.contacts_golfleaguesetup_treasureridTocontacts),
      scoringType: setup.scoringtype as 'individual' | 'team',
      useBestBall: setup.usebestball,
      useHandicapScoring: setup.usehandicapscoring,
      perHolePoints: setup.perholepoints,
      perNinePoints: setup.perninepoints,
      perMatchPoints: setup.permatchpoints,
      totalHolesPoints: setup.totalholespoints,
      againstFieldPoints: setup.againstfieldpoints,
      againstFieldDescPoints: setup.againstfielddescpoints,
      absentPlayerMode: this.mapAbsentPlayerMode(setup.absentplayermode),
      absentPlayerPenalty: setup.absentplayerpenalty,
      fullTeamAbsentMode: this.mapFullTeamAbsentMode(setup.fullteamabsentmode),
    };
  }

  static formatGolfAccount(account: GolfAccountInfo): GolfAccountInfoResponse {
    return {
      id: account.id.toString(),
      name: account.name,
      accountTypeName: account.accountTypeName,
      hasGolfSetup: account.hasGolfSetup,
    };
  }

  static formatGolfAccounts(accounts: GolfAccountInfo[]): GolfAccountInfoResponse[] {
    return accounts.map((a) => this.formatGolfAccount(a));
  }
}
