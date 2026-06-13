import { IRosterRepository } from '../repositories/interfaces/IRosterRepository.js';
import { IManagerRepository } from '../repositories/interfaces/IManagerRepository.js';
import {
  IContactRepository,
  ContactExportOptions,
} from '../repositories/interfaces/IContactRepository.js';
import { IRoleRepository } from '../repositories/interfaces/IRoleRepository.js';
import { IWorkoutRepository } from '../repositories/interfaces/IWorkoutRepository.js';
import {
  dbRosterExportData,
  dbManagerExportData,
  dbContactExportData,
  dbWorkoutRegistration,
  dbWaiverExportData,
} from '../repositories/types/dbTypes.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  generateCsv,
  RosterExportRow,
  ManagerExportRow,
  ContactExportRow,
  WorkoutRegistrationExportRow,
  WaiverExportRow,
  BattingStatsExportRow,
  PitchingStatsExportRow,
  ROSTER_EXPORT_HEADERS,
  MANAGER_EXPORT_HEADERS,
  CONTACT_EXPORT_HEADERS,
  WORKOUT_REGISTRATION_EXPORT_HEADERS,
  WAIVER_EXPORT_HEADERS,
  BATTING_STATS_EXPORT_HEADERS,
  PITCHING_STATS_EXPORT_HEADERS,
  CAREER_BATTING_STATS_EXPORT_HEADERS,
  CAREER_PITCHING_STATS_EXPORT_HEADERS,
} from '../utils/csvGenerator.js';
import { PayloadTooLargeError } from '../utils/customErrors.js';
import type {
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
  PlayerCareerBattingRowType,
  PlayerCareerPitchingRowType,
} from '@draco/shared-schemas';

export const MAX_EXPORT_ROWS = 10000;

export interface CsvExportResult {
  buffer: Buffer;
  fileName: string;
}

export class CsvExportService {
  constructor(
    private readonly rosterRepository: IRosterRepository,
    private readonly managerRepository: IManagerRepository,
    private readonly contactRepository?: IContactRepository,
    private readonly roleRepository?: IRoleRepository,
    private readonly workoutRepository?: IWorkoutRepository,
  ) {}

  async exportTeamRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    teamName: string,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const rosterData = await this.rosterRepository.findRosterMembersForExport(
      teamSeasonId,
      seasonId,
    );
    this.checkExportLimit(rosterData.length, 'team roster', teamName);
    const rows = this.mapRosterToExportRows(rosterData);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(teamName);
    this.logExportMetrics('team roster', teamName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportLeagueRoster(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { leagueName, members } = await this.rosterRepository.findLeagueRosterForExport(
      accountId,
      seasonId,
      leagueSeasonId,
    );
    this.checkExportLimit(members.length, 'league roster', leagueName);
    const rows = this.mapRosterToExportRows(members);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics('league roster', leagueName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportTeamWaivers(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { teamName, members } = await this.rosterRepository.findTeamWaiverRosterForExport(
      accountId,
      seasonId,
      teamSeasonId,
    );
    const rows = this.mapWaiversToExportRows(members);
    this.checkExportLimit(rows.length, 'team waivers', teamName);
    const buffer = await generateCsv(rows, WAIVER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(teamName);
    this.logExportMetrics('team waivers', teamName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-waivers.csv`,
    };
  }

  async exportLeagueWaivers(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { leagueName, members } = await this.rosterRepository.findLeagueWaiverRosterForExport(
      accountId,
      seasonId,
      leagueSeasonId,
    );
    const rows = this.mapWaiversToExportRows(members);
    this.checkExportLimit(rows.length, 'league waivers', leagueName);
    const buffer = await generateCsv(rows, WAIVER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics('league waivers', leagueName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-waivers.csv`,
    };
  }

  async exportTeamMissingWaivers(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { teamName, members } = await this.rosterRepository.findTeamMissingWaiverRosterForExport(
      accountId,
      seasonId,
      teamSeasonId,
    );
    const rows = this.mapMissingWaiversToExportRows(members);
    this.checkExportLimit(rows.length, 'team missing waivers', teamName);
    const buffer = await generateCsv(rows, WAIVER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(teamName);
    this.logExportMetrics('team missing waivers', teamName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-missing-waivers.csv`,
    };
  }

  async exportLeagueMissingWaivers(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { leagueName, members } =
      await this.rosterRepository.findLeagueMissingWaiverRosterForExport(
        accountId,
        seasonId,
        leagueSeasonId,
      );
    const rows = this.mapMissingWaiversToExportRows(members);
    this.checkExportLimit(rows.length, 'league missing waivers', leagueName);
    const buffer = await generateCsv(rows, WAIVER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics(
      'league missing waivers',
      leagueName,
      rows.length,
      buffer.length,
      startTime,
    );
    return {
      buffer,
      fileName: `${sanitizedName}-missing-waivers.csv`,
    };
  }

  async exportSeasonRoster(accountId: bigint, seasonId: bigint): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { seasonName, members } = await this.rosterRepository.findSeasonRosterForExport(
      accountId,
      seasonId,
    );
    this.checkExportLimit(members.length, 'season roster', seasonName);
    const rows = this.mapRosterToExportRows(members);
    const buffer = await generateCsv(rows, ROSTER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    this.logExportMetrics('season roster', seasonName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-roster.csv`,
    };
  }

  async exportLeagueManagers(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { leagueName, managers } = await this.managerRepository.findLeagueManagersForExport(
      accountId,
      seasonId,
      leagueSeasonId,
    );
    this.checkExportLimit(managers.length, 'league managers', leagueName);
    const rows = this.mapManagersToExportRows(managers);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(leagueName);
    this.logExportMetrics('league managers', leagueName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-managers.csv`,
    };
  }

  async exportSeasonManagers(accountId: bigint, seasonId: bigint): Promise<CsvExportResult> {
    const startTime = Date.now();
    const { seasonName, managers } = await this.managerRepository.findSeasonManagersForExport(
      accountId,
      seasonId,
    );
    this.checkExportLimit(managers.length, 'season managers', seasonName);
    const rows = this.mapManagersToExportRows(managers);
    const buffer = await generateCsv(rows, MANAGER_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(seasonName);
    this.logExportMetrics('season managers', seasonName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-managers.csv`,
    };
  }

  async exportContacts(
    accountId: bigint,
    accountName: string,
    options: ContactExportOptions = {},
  ): Promise<CsvExportResult> {
    if (!this.contactRepository) {
      throw new Error('Contact repository is required for contact exports');
    }
    if (!this.roleRepository) {
      throw new Error('Role repository is required for contact exports');
    }
    const startTime = Date.now();

    const [contactData, allRoles] = await Promise.all([
      this.contactRepository.findContactsForExport(accountId, options),
      this.roleRepository.findAllRoles(),
    ]);

    const roleNameMap = new Map(allRoles.map((role) => [role.id, role.name]));

    this.checkExportLimit(contactData.length, 'contacts', accountName);
    const rows = this.mapContactsToExportRows(contactData, roleNameMap);
    const buffer = await generateCsv(rows, CONTACT_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(accountName);
    this.logExportMetrics('contacts', accountName, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}-users.csv`,
    };
  }

  async exportWorkoutRegistrations(
    accountId: bigint,
    workoutId: bigint,
    workoutDesc: string,
    workoutDate: Date,
  ): Promise<CsvExportResult> {
    if (!this.workoutRepository) {
      throw new Error('Workout repository is required for workout registration exports');
    }
    const startTime = Date.now();
    const registrations = await this.workoutRepository.listRegistrations(
      accountId,
      workoutId,
      MAX_EXPORT_ROWS + 1,
    );
    this.checkExportLimit(registrations.length, 'workout registrations', workoutDesc);
    const rows = this.mapWorkoutRegistrationsToExportRows(registrations);
    const buffer = await generateCsv(rows, WORKOUT_REGISTRATION_EXPORT_HEADERS);
    const sanitizedName = this.sanitizeFileName(workoutDesc);
    const datePart = workoutDate.toISOString().slice(0, 10);
    this.logExportMetrics(
      'workout registrations',
      workoutDesc,
      rows.length,
      buffer.length,
      startTime,
    );
    return {
      buffer,
      fileName: `${sanitizedName}-${datePart}-registrations.csv`,
    };
  }

  private mapWorkoutRegistrationsToExportRows(
    data: dbWorkoutRegistration[],
  ): WorkoutRegistrationExportRow[] {
    return data.map((registration) => ({
      name: registration.name,
      email: registration.email,
      age: registration.age != null ? String(registration.age) : '',
      phone1: registration.phone1 ?? '',
      phone2: registration.phone2 ?? '',
      phone3: registration.phone3 ?? '',
      phone4: registration.phone4 ?? '',
      positions: registration.positions ?? '',
      isManager: registration.ismanager ? 'Yes' : 'No',
      whereHeard: registration.whereheard ?? '',
      dateRegistered: registration.dateregistered ? registration.dateregistered.toISOString() : '',
    }));
  }

  private mapRosterToExportRows(data: dbRosterExportData[]): RosterExportRow[] {
    return data.map((item) => {
      const contact = item.roster.contacts;
      const rosterSeasons = item.roster.rosterseason;
      const submittedWaiver = rosterSeasons.some((rs) => rs.submittedwaiver);
      const registeredTeams = [
        ...new Set(
          rosterSeasons
            .map((rs) => `${rs.teamsseason.leagueseason.league.name} / ${rs.teamsseason.name}`)
            .sort(),
        ),
      ].join('; ');
      return {
        fullName: this.formatFullName(contact.firstname, contact.middlename, contact.lastname),
        email: contact.email ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        submittedWaiver: submittedWaiver ? 'Yes' : 'No',
        registeredTeams,
      };
    });
  }

  private mapWaiverItemToExportRow(item: dbWaiverExportData): WaiverExportRow {
    const contact = item.roster.contacts;
    return {
      fullName: this.formatFullName(contact.firstname, contact.middlename, contact.lastname),
      email: contact.email ?? '',
      streetAddress: contact.streetaddress ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      zip: contact.zip ?? '',
      team: item.teamsseason.name,
    };
  }

  private mapWaiversToExportRows(data: dbWaiverExportData[]): WaiverExportRow[] {
    return data
      .filter((item) => {
        const email = item.roster.contacts.email;
        return email !== null && email.trim() !== '';
      })
      .map((item) => this.mapWaiverItemToExportRow(item));
  }

  private mapMissingWaiversToExportRows(data: dbWaiverExportData[]): WaiverExportRow[] {
    return data.map((item) => this.mapWaiverItemToExportRow(item));
  }

  private mapManagersToExportRows(data: dbManagerExportData[]): ManagerExportRow[] {
    return data.map((item) => {
      const contact = item.contacts;
      const leagueName = item.teamsseason.leagueseason.league.name;
      const teamName = item.teamsseason.name;
      return {
        fullName: this.formatFullName(contact.firstname, contact.middlename, contact.lastname),
        email: contact.email ?? '',
        phone2: contact.phone2 ?? '',
        phone3: contact.phone3 ?? '',
        phone1: contact.phone1 ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        leagueTeamName: `${leagueName} - ${teamName}`,
      };
    });
  }

  private mapContactsToExportRows(
    data: dbContactExportData[],
    roleNameMap: Map<string, string | null>,
  ): ContactExportRow[] {
    return data.map((contact) => {
      const roleNames = contact.contactroles
        .map((cr) => roleNameMap.get(cr.roleid) ?? cr.roleid)
        .filter(Boolean)
        .join(', ');
      return {
        lastName: contact.lastname ?? '',
        firstName: contact.firstname ?? '',
        middleName: contact.middlename ?? '',
        email: contact.email ?? '',
        streetAddress: contact.streetaddress ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        dateOfBirth: this.formatDate(contact.dateofbirth),
        phone1: contact.phone1 ?? '',
        phone2: contact.phone2 ?? '',
        phone3: contact.phone3 ?? '',
        roles: roleNames,
      };
    });
  }

  private formatFullName(
    firstName: string | null,
    middleName: string | null,
    lastName: string | null,
  ): string {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    return parts.join(' ');
  }

  private formatDate(date: Date | null): string {
    return DateUtils.formatDateOfBirthForResponse(date) ?? '';
  }

  exportBattingStatistics(
    stats: PlayerBattingStatsType[],
    fileNameBase: string,
  ): Promise<CsvExportResult> {
    return this.buildStatisticsCsv(
      stats,
      BATTING_STATS_EXPORT_HEADERS,
      (row) => this.mapBattingStatRow(row),
      fileNameBase,
      'batting statistics',
    );
  }

  exportPitchingStatistics(
    stats: PlayerPitchingStatsType[],
    fileNameBase: string,
  ): Promise<CsvExportResult> {
    return this.buildStatisticsCsv(
      stats,
      PITCHING_STATS_EXPORT_HEADERS,
      (row) => this.mapPitchingStatRow(row),
      fileNameBase,
      'pitching statistics',
    );
  }

  exportCareerBattingStatistics(
    rows: PlayerCareerBattingRowType[],
    fileNameBase: string,
  ): Promise<CsvExportResult> {
    return this.buildStatisticsCsv(
      rows.filter((row) => row.level !== 'career' && !row.isTotals),
      CAREER_BATTING_STATS_EXPORT_HEADERS,
      (row) => ({
        season: row.seasonName ?? '',
        teamName: this.careerAffiliationLabel(row.leagueName, row.teamName),
        ...this.mapBattingStatColumns(row),
      }),
      fileNameBase,
      'career batting statistics',
    );
  }

  exportCareerPitchingStatistics(
    rows: PlayerCareerPitchingRowType[],
    fileNameBase: string,
  ): Promise<CsvExportResult> {
    return this.buildStatisticsCsv(
      rows.filter((row) => row.level !== 'career' && !row.isTotals),
      CAREER_PITCHING_STATS_EXPORT_HEADERS,
      (row) => ({
        season: row.seasonName ?? '',
        teamName: this.careerAffiliationLabel(row.leagueName, row.teamName),
        ...this.mapPitchingStatColumns(row),
      }),
      fileNameBase,
      'career pitching statistics',
    );
  }

  private async buildStatisticsCsv<TSource, TRow extends object>(
    source: TSource[],
    headers: { key: keyof TRow; header: string }[],
    mapRow: (item: TSource) => TRow,
    fileNameBase: string,
    exportType: string,
  ): Promise<CsvExportResult> {
    const startTime = Date.now();
    this.checkExportLimit(source.length, exportType, fileNameBase);
    const rows = source.map(mapRow);
    const buffer = await generateCsv(rows, headers);
    const sanitizedName = this.sanitizeFileName(fileNameBase);
    this.logExportMetrics(exportType, fileNameBase, rows.length, buffer.length, startTime);
    return {
      buffer,
      fileName: `${sanitizedName}.csv`,
    };
  }

  private mapBattingStatColumns(
    row: PlayerBattingStatsType,
  ): Omit<BattingStatsExportRow, 'playerName' | 'teamName'> {
    return {
      ab: this.formatCount(row.ab),
      h: this.formatCount(row.h),
      r: this.formatCount(row.r),
      d: this.formatCount(row.d),
      t: this.formatCount(row.t),
      hr: this.formatCount(row.hr),
      rbi: this.formatCount(row.rbi),
      so: this.formatCount(row.so),
      bb: this.formatCount(row.bb),
      hbp: this.formatCount(row.hbp),
      sb: this.formatCount(row.sb),
      cs: this.formatCount(row.cs),
      sf: this.formatCount(row.sf),
      sh: this.formatCount(row.sh),
      re: this.formatCount(row.re),
      intr: this.formatCount(row.intr),
      lob: this.formatCount(row.lob),
      tb: this.formatCount(row.tb),
      pa: this.formatCount(row.pa),
      avg: this.formatRate(row.avg, 3),
      obp: this.formatRate(row.obp, 3),
      slg: this.formatRate(row.slg, 3),
      ops: this.formatRate(row.ops, 3),
    };
  }

  private mapBattingStatRow(row: PlayerBattingStatsType): BattingStatsExportRow {
    return {
      playerName: row.playerName ?? '',
      teamName: this.teamLabel(row.teams, row.teamName),
      ...this.mapBattingStatColumns(row),
    };
  }

  private mapPitchingStatColumns(
    row: PlayerPitchingStatsType,
  ): Omit<PitchingStatsExportRow, 'playerName' | 'teamName'> {
    return {
      w: this.formatCount(row.w),
      l: this.formatCount(row.l),
      s: this.formatCount(row.s),
      ipDecimal: this.formatRate(row.ipDecimal, 1),
      h: this.formatCount(row.h),
      r: this.formatCount(row.r),
      er: this.formatCount(row.er),
      d: this.formatCount(row.d),
      t: this.formatCount(row.t),
      hr: this.formatCount(row.hr),
      so: this.formatCount(row.so),
      bb: this.formatCount(row.bb),
      bf: this.formatCount(row.bf),
      wp: this.formatCount(row.wp),
      hbp: this.formatCount(row.hbp),
      bk: this.formatCount(row.bk),
      sc: this.formatCount(row.sc),
      era: this.formatRate(row.era, 2),
      whip: this.formatRate(row.whip, 2),
      k9: this.formatRate(row.k9, 2),
      bb9: this.formatRate(row.bb9, 2),
      oba: this.formatRate(row.oba, 3),
      slg: this.formatRate(row.slg, 3),
    };
  }

  private mapPitchingStatRow(row: PlayerPitchingStatsType): PitchingStatsExportRow {
    return {
      playerName: row.playerName ?? '',
      teamName: this.teamLabel(row.teams, row.teamName),
      ...this.mapPitchingStatColumns(row),
    };
  }

  private teamLabel(teams: string[] | undefined, teamName: string | undefined): string {
    if (Array.isArray(teams) && teams.length > 0) {
      return teams.join('; ');
    }
    return teamName ?? '';
  }

  private careerAffiliationLabel(
    leagueName: string | null | undefined,
    teamName: string | null | undefined,
  ): string {
    const league = leagueName?.trim();
    const team = teamName?.trim();
    if (league && team) {
      return `${league} ${team}`;
    }
    return team ?? league ?? '';
  }

  private formatCount(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '';
    }
    return String(value);
  }

  private formatRate(value: number | null | undefined, digits: number): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '';
    }
    return value.toFixed(digits);
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }

  private checkExportLimit(rowCount: number, exportType: string, name: string): void {
    if (rowCount > MAX_EXPORT_ROWS) {
      console.warn(
        `📊 Export limit exceeded for ${exportType} "${name}": ${rowCount} rows (limit: ${MAX_EXPORT_ROWS})`,
      );
      throw new PayloadTooLargeError(
        `Export limit exceeded: ${rowCount} rows requested, maximum is ${MAX_EXPORT_ROWS}`,
      );
    }
  }

  private logExportMetrics(
    exportType: string,
    name: string,
    rowCount: number,
    bufferSize: number,
    startTime: number,
  ): void {
    const durationMs = Date.now() - startTime;
    console.log(
      `📊 CSV Export: ${exportType} "${name}" - ${rowCount} rows, ${(bufferSize / 1024).toFixed(1)} KB, ${durationMs}ms`,
    );
  }
}
