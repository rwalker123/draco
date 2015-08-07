using ModelObjects;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Linq.Dynamic;

namespace SportsManager.Utils
{
    public class BatStatsHelper : StatsHelper
    {
        public BatStatsHelper(DB db) : base(db)
        {
        }

        private static List<LeaderCategory> m_batCats = new List<LeaderCategory>()
                {
                    new LeaderCategory() {
                        Name = "AB",
                        Id = "AB"
                    },
                    new LeaderCategory() {
                        Name = "H",
                        Id = "H"
                    },
                    new LeaderCategory() {
                        Name = "R",
                        Id = "R"
                    },
                    new LeaderCategory() {
                        Name = "2B",
                        Id = "2B"
                    },
                    new LeaderCategory() {
                        Name = "3B",
                        Id = "3B"
                    },
                    new LeaderCategory() {
                        Name = "HR",
                        Id = "HR"
                    },
                    new LeaderCategory() {
                        Name = "RBI",
                        Id = "RBI"
                    },
                    new LeaderCategory() {
                        Name = "BB",
                        Id = "BB"
                    },
                    new LeaderCategory() {
                        Name = "HBP",
                        Id = "HBP"
                    },
                    new LeaderCategory() {
                        Name = "SB",
                        Id = "SB"
                    },
                    new LeaderCategory() {
                        Name = "TB",
                        Id = "TB"
                    },
                    new LeaderCategory() {
                        Name = "PA",
                        Id = "PA"
                    },
                    new LeaderCategory() {
                        Name = "OBP",
                        Id = "OBP&calcMinAB=1",
                        NumDecimals = 3
                    },
                    new LeaderCategory() {
                        Name = "SLG",
                        Id = "SLG&calcMinAB=1",
                        NumDecimals = 3
                    },
                    new LeaderCategory() {
                        Name = "OPS",
                        Id = "OPS&calcMinAB=1",
                        NumDecimals = 3
                    },
                    new LeaderCategory() {
                        Name = "AVG",
                        Id = "AVG&calcMinAB=1",
                        NumDecimals = 3,
                        TrimLeadingZero = true
                    }
                };

        public static IEnumerable<LeaderCategory> AvailableBatCategories()
        {
            return m_batCats;
        }

        public List<LeagueLeaderStatViewModel> GetBatLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minAB, bool allTimeLeaders)
        {
            var stats = new List<LeagueLeaderStatViewModel>();

            bool abCheck = NeedABCheck(fieldName);

            String queryString = GetBatLeagueLeadersQueryString(leagueId, divisionId, fieldName, allTimeLeaders);
            
            var result = m_db.Database.SqlQuery<LeaderStatRecord>(queryString, new object[] { }).AsQueryable();
            return ProcessLeaders(result, fieldName, allTimeLeaders, limitRecords, abCheck, minAB);
        }

        public IQueryable<BatStatsViewModel> GetBatLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats) //, out int totalRecords)
        {
            if (historicalStats)
            {
                var batstats = (from bss in m_db.Batstatsums
                                join rs in m_db.RosterSeasons on bss.PlayerId equals rs.Id
                                join leagueSchedule in m_db.LeagueSchedules on bss.GameId equals leagueSchedule.Id
                                join leagueSeason in m_db.LeagueSeasons on leagueSchedule.LeagueId equals leagueSeason.Id
                                where leagueSchedule.GameStatus == 1 && leagueSeason.LeagueId == leagueId
                                group bss by rs.PlayerId into g
                                let ab = g.Sum(b => b.Ab)
                                let h = g.Sum(b => b.H)
                                let bb = g.Sum(b => b.Bb)
                                let hbp = g.Sum(b => b.Hbp)
                                let d = g.Sum(b => b.C2B)
                                let t = g.Sum(b => b.C3B)
                                let hr = g.Sum(b => b.Hr)
                                let sh = g.Sum(b => b.Sh)
                                let sf = g.Sum(b => b.Sf)
                                let intr = g.Sum(b => b.Intr)
                                let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                select new CareerBatStatsViewModel
                                {
                                    PlayerId = g.Key,
                                    AB = ab,
                                    H = h,
                                    R = g.Sum(b => b.R),
                                    D = d,
                                    T = t,
                                    HR = hr,
                                    RBI = g.Sum(b => b.Rbi),
                                    SO = g.Sum(b => b.So),
                                    BB = bb,
                                    RE = g.Sum(b => b.Re),
                                    HBP = hbp,
                                    INTR = intr,
                                    SF = sf,
                                    SH = sh,
                                    SB = g.Sum(b => b.Sb),
                                    CS = g.Sum(b => b.Cs),
                                    LOB = g.Sum(b => b.Lob),
                                    AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                                    PA = ab + bb + hbp + sh + sf + intr,
                                    TB = tb
                                    //PlayerName = ContactViewModel.BuildFullName(m_db.Rosters.Find(g.Key)?.Contact)
                                }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = batstats.Count();

                return batstats;
            }
            else
            {
                var batstats = (from bss in m_db.Batstatsums
                                join ls in m_db.LeagueSchedules on bss.GameId equals ls.Id
                                where ls.GameStatus == 1 && ls.LeagueId == leagueId
                                group bss by bss.PlayerId into g
                                let ab = g.Sum(b => b.Ab)
                                let h = g.Sum(b => b.H)
                                let bb = g.Sum(b => b.Bb)
                                let hbp = g.Sum(b => b.Hbp)
                                let d = g.Sum(b => b.C2B)
                                let t = g.Sum(b => b.C3B)
                                let hr = g.Sum(b => b.Hr)
                                let sh = g.Sum(b => b.Sh)
                                let sf = g.Sum(b => b.Sf)
                                let intr = g.Sum(b => b.Intr)
                                let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                select new BatStatsViewModel
                                {
                                    PlayerId = g.Key,
                                    AB = ab,
                                    H = h,
                                    R = g.Sum(b => b.R),
                                    D = d,
                                    T = t,
                                    HR = hr,
                                    RBI = g.Sum(b => b.Rbi),
                                    SO = g.Sum(b => b.So),
                                    BB = bb,
                                    RE = g.Sum(b => b.Re),
                                    HBP = hbp,
                                    INTR = intr,
                                    SF = sf,
                                    SH = sh,
                                    SB = g.Sum(b => b.Sb),
                                    CS = g.Sum(b => b.Cs),
                                    LOB = g.Sum(b => b.Lob),
                                    AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                                    PA = ab + bb + hbp + sh + sf + intr,
                                    TB = tb
                                }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = batstats.Count();

                return batstats;
            }
        }

        public IQueryable<BatStatsViewModel> GetBatLeaguePlayerTotals(long leagueId, long divisionId, string sortField, string sortOrder)
        {
            return (from bss in m_db.Batstatsums
                    join ls in m_db.LeagueSchedules on bss.GameId equals ls.Id
                    join ts in m_db.TeamsSeasons on bss.TeamId equals ts.Id
                    where ls.GameStatus == 1 && ls.LeagueId == leagueId && ts.DivisionSeasonId == divisionId
                    group bss by bss.PlayerId into g
                    let ab = g.Sum(b => b.Ab)
                    let h = g.Sum(b => b.H)
                    let bb = g.Sum(b => b.Bb)
                    let hbp = g.Sum(b => b.Hbp)
                    let d = g.Sum(b => b.C2B)
                    let t = g.Sum(b => b.C3B)
                    let hr = g.Sum(b => b.Hr)
                    let sh = g.Sum(b => b.Sh)
                    let sf = g.Sum(b => b.Sf)
                    let intr = g.Sum(b => b.Intr)
                    let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                    select new BatStatsViewModel
                    {
                        PlayerId = g.Key,
                        AB = ab,
                        H = h,
                        R = g.Sum(b => b.R),
                        D = d,
                        T = t,
                        HR = hr,
                        RBI = g.Sum(b => b.Rbi),
                        SO = g.Sum(b => b.So),
                        BB = bb,
                        RE = g.Sum(b => b.Re),
                        HBP = hbp,
                        INTR = intr,
                        SF = sf,
                        SH = sh,
                        SB = g.Sum(b => b.Sb),
                        CS = g.Sum(b => b.Cs),
                        LOB = g.Sum(b => b.Lob),
                        AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                        PA = ab + bb + hbp + sh + sf + intr,
                        TB = tb
                    }).OrderBy(sortField + " " + sortOrder);
        }

        public IQueryable<GameBatStats> GetBatGameStats(long gameId, long teamId)
        {
            return (from bs in m_db.Batstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    select bs);
        }

        public List<LeagueLeaderStatViewModel> GetBatTeamLeaders(long teamSeasonId, string fieldName, int limitRecords, int minAB)
        {
            var stats = new List<LeagueLeaderStatViewModel>();

            bool abCheck = NeedABCheck(fieldName);

            String queryString = GetBatTeamLeadersQueryString(teamSeasonId, fieldName);

            var result = m_db.Database.SqlQuery<LeaderStatRecord>(queryString, new object[] { }).AsQueryable();
            return ProcessLeaders(result, fieldName, false, limitRecords, abCheck, minAB);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="playerId"></param>
        /// <param name="fromSeason">playerId is either a contactId or rosterSeasonId</param>
        /// <returns></returns>
        public IQueryable<CareerBatStatsViewModel> GetBatPlayerCareer(long playerId, bool fromSeason)
        {
            //SELECT Season.Name as SeasonName, TeamsSeason.Name as TeamName, League.Name as LeagueName, SUM(AB) as AB, SUM(H) as H, SUM(R) as R, SUM([2B]) as [2B], SUM([3B]) as [3B], SUM(HR) as HR, SUM(RBI) as RBI, SUM(SO) as SO, SUM(BB) as BB, SUM(HBP) as HBP, SUM(INTR) as INTR, SUM(SF) as SF, SUM(SH) as SH, SUM(SB) as SB, @playerId 
            //FROM RosterSeason 
            //     LEFT JOIN TeamsSeason ON RosterSeason.TeamSeasonId = TeamsSeason.Id 
            //     LEFT JOIN Teams ON Teams.Id = TeamsSeason.TeamId 
            //     LEFT JOIN LeagueSeason ON LeagueSeason.Id = TeamsSeason.LeagueSeasonId 
            //     LEFT JOIN Season ON Season.Id = LeagueSeason.SeasonId 
            //     LEFT JOIN League ON League.Id = LeagueSeason.LeagueId 
            //     LEFT JOIN batstatsum ON RosterSeason.Id = batstatsum.PlayerId 
            //WHERE RosterSeason.PlayerId = @playerId AND batstatsum.Id IS NOT NULL 
            //GROUP BY RosterSeason.Id, Season.Name, League.Name, TeamsSeason.Name ORDER BY Season.Name, League.Name, TeamsSeason.Name

            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in m_db.RosterSeasons
                                   join r in m_db.Rosters on rs.PlayerId equals r.Id
                                   where rs.Id == playerId
                                   select r.Contact.Id).SingleOrDefault();
            }
            else
            {
                playerContactId = playerId;
            }

            if (playerContactId == 0)
                return null;

            // get the roster id from contact.
            long rosterPlayerId = (from r in m_db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            return (from rs in m_db.RosterSeasons
                    join ts in m_db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join t in m_db.Teams on ts.TeamId equals t.Id
                    join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join s in m_db.Seasons on ls.SeasonId equals s.Id
                    join l in m_db.Leagues on ls.LeagueId equals l.Id
                    join bss in m_db.Batstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId && bss.Id != 0
                    group new { bss, s, l, ts } by new { bss.PlayerId, seasonName = s.Name, leagueName = l.Name, teamName = ts.Name } into g
                    orderby g.Key.seasonName, g.Key.leagueName, g.Key.teamName
                    select new CareerBatStatsViewModel()
                    {
                        Id = g.Key.PlayerId,
                        SeasonName = g.Key.seasonName,
                        TeamName = g.Key.teamName,
                        LeagueName = g.Key.leagueName,
                        AB = g.Sum(b => b.bss.Ab),
                        H = g.Sum(b => b.bss.H),
                        R = g.Sum(b => b.bss.R),
                        D = g.Sum(b => b.bss.C2B),
                        T = g.Sum(b => b.bss.C3B),
                        HR = g.Sum(b => b.bss.Hr),
                        RBI = g.Sum(b => b.bss.Rbi),
                        SO = g.Sum(b => b.bss.So),
                        BB = g.Sum(b => b.bss.Bb),
                        HBP = g.Sum(b => b.bss.Hbp),
                        INTR = g.Sum(b => b.bss.Intr),
                        SF = g.Sum(b => b.bss.Sf),
                        SH = g.Sum(b => b.bss.Sh),
                        SB = g.Sum(b => b.bss.Sb)
                    });
        }

        public CareerBatStatsViewModel GetBatPlayerCareerTotal(long playerId, bool fromSeason)
        {
            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in m_db.RosterSeasons
                                   join r in m_db.Rosters on rs.PlayerId equals r.Id
                                   where rs.Id == playerId
                                   select r.Contact.Id).SingleOrDefault();
            }
            else
            {
                playerContactId = playerId;
            }

            if (playerContactId == 0)
                return null;

            // get the roster id from contact.
            long rosterPlayerId = (from r in m_db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            //SELECT SUM(AB) as AB, SUM(H) as H, SUM(R) as R, SUM([2B]) as [2B], SUM([3B]) as [3B], SUM(HR) as HR, SUM(RBI) as RBI, SUM(SO) as SO, SUM(BB) as BB, SUM(HBP) as HBP, SUM(INTR) as INTR, SUM(SF) as SF, SUM(SH) as SH, SUM(SB) as SB, @playerId 
            //FROM RosterSeason LEFT JOIN batstatsum ON RosterSeason.Id = batstatsum.PlayerId 
            //WHERE RosterSeason.PlayerId = @playerId

            return (from rs in m_db.RosterSeasons
                    join bss in m_db.Batstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId
                    group new { rs, bss } by rs.PlayerId into g
                    select new CareerBatStatsViewModel()
                    {
                        Id = g.Key,
                        AB = g.Sum(b => b.bss.Ab),
                        H = g.Sum(b => b.bss.H),
                        R = g.Sum(b => b.bss.R),
                        D = g.Sum(b => b.bss.C2B),
                        T = g.Sum(b => b.bss.C3B),
                        HR = g.Sum(b => b.bss.Hr),
                        RBI = g.Sum(b => b.bss.Rbi),
                        SO = g.Sum(b => b.bss.So),
                        BB = g.Sum(b => b.bss.Bb),
                        HBP = g.Sum(b => b.bss.Hbp),
                        INTR = g.Sum(b => b.bss.Intr),
                        SF = g.Sum(b => b.bss.Sf),
                        SH = g.Sum(b => b.bss.Sh),
                        SB = g.Sum(b => b.bss.Sb)
                    }).SingleOrDefault();
        }

        public IQueryable<BatStatsViewModel> GetBatTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
        {
            // filters not implemented yet...
            //case 2: // vs. Team
            //    myCommand = new SqlCommand("dbo.GetBatTeamPlayerTotalsVsTeam", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
            //    break;
            //case 3: // vs. Division
            //    myCommand = new SqlCommand("dbo.GetBatTeamPlayerTotalsVsDivision", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
            //    break;
            //case 4: // Single Game
            //    myCommand = new SqlCommand("dbo.GetBatTeamPlayerTotalsByGame", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
            //    break;

            if (historicalStats)
            {
                return (from bss in m_db.Batstatsums
                        join rs in m_db.RosterSeasons on bss.PlayerId equals rs.Id
                        join ts in m_db.TeamsSeasons on bss.TeamId equals ts.Id
                        where ts.TeamId == teamId
                        group bss by rs.PlayerId into g
                        let ab = g.Sum(b => b.Ab)
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.Bb)
                        let hbp = g.Sum(b => b.Hbp)
                        let d = g.Sum(b => b.C2B)
                        let t = g.Sum(b => b.C3B)
                        let hr = g.Sum(b => b.Hr)
                        let sh = g.Sum(b => b.Sh)
                        let sf = g.Sum(b => b.Sf)
                        let intr = g.Sum(b => b.Intr)
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        select new CareerBatStatsViewModel
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            AB = ab,
                            H = h,
                            R = g.Sum(b => b.R),
                            D = d,
                            T = t,
                            HR = hr,
                            RBI = g.Sum(b => b.Rbi),
                            SO = g.Sum(b => b.So),
                            BB = bb,
                            RE = g.Sum(b => b.Re),
                            HBP = hbp,
                            INTR = intr,
                            SF = sf,
                            SH = sh,
                            SB = g.Sum(b => b.Sb),
                            CS = g.Sum(b => b.Cs),
                            LOB = g.Sum(b => b.Lob),
                            AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                            PA = ab + bb + hbp + sh + sf + intr,
                            TB = tb
                        }).OrderBy(sortField + " " + sortOrder);
            }
            else
            {
                return (from bss in m_db.Batstatsums
                        where bss.TeamId == teamId
                        group bss by bss.PlayerId into g
                        let ab = g.Sum(b => b.Ab)
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.Bb)
                        let hbp = g.Sum(b => b.Hbp)
                        let d = g.Sum(b => b.C2B)
                        let t = g.Sum(b => b.C3B)
                        let hr = g.Sum(b => b.Hr)
                        let sh = g.Sum(b => b.Sh)
                        let sf = g.Sum(b => b.Sf)
                        let intr = g.Sum(b => b.Intr)
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        select new BatStatsViewModel
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            AB = ab,
                            H = h,
                            R = g.Sum(b => b.R),
                            D = d,
                            T = t,
                            HR = hr,
                            RBI = g.Sum(b => b.Rbi),
                            SO = g.Sum(b => b.So),
                            BB = bb,
                            RE = g.Sum(b => b.Re),
                            HBP = hbp,
                            INTR = intr,
                            SF = sf,
                            SH = sh,
                            SB = g.Sum(b => b.Sb),
                            CS = g.Sum(b => b.Cs),
                            LOB = g.Sum(b => b.Lob),
                            AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                            PA = ab + bb + hbp + sh + sf + intr,
                            TB = tb
                        }).OrderBy(sortField + " " + sortOrder);

            }
        }

        public BatStatsViewModel GetBatGameTotals(long gameId, long teamId)
        {
            return (from bs in m_db.Batstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    group bs by new { bs.GameId, bs.TeamId } into g
                    select new BatStatsViewModel()
                    {
                        GameId = gameId,
                        TeamId = teamId,
                        AB = g.Sum(s => s.Ab),
                        H = g.Sum(s => s.H),
                        R = g.Sum(s => s.R),
                        D = g.Sum(s => s.C2B),
                        T = g.Sum(s => s.C3B),
                        HR = g.Sum(s => s.Hr),
                        RBI = g.Sum(s => s.Rbi),
                        SO = g.Sum(s => s.So),
                        BB = g.Sum(s => s.Bb),
                        RE = g.Sum(s => s.Re),
                        HBP = g.Sum(s => s.Hbp),
                        INTR = g.Sum(s => s.Intr),
                        SF = g.Sum(s => s.Sf),
                        SH = g.Sum(s => s.Sh),
                        SB = g.Sum(s => s.Sb),
                        CS = g.Sum(s => s.Cs),
                        LOB = g.Sum(s => s.Lob)
                    }).SingleOrDefault();

        }

        public BatStatsViewModel GetBatTeamSeasonTotals(long teamSeasonId, long seasonId)
        {
            var nteamId = m_db.TeamsSeasons.Find(teamSeasonId)?.Team.Id;
            var teamId = nteamId.GetValueOrDefault();

            if (seasonId == 0)
            {
                return (from bs in m_db.Batstatsums
                        join ts in m_db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in m_db.Teams on ts.TeamId equals t.Id
                        where t.Id == teamId
                        group bs by t.Id into g
                        select new BatStatsViewModel()
                        {
                            TeamId = teamId,
                            AB = g.Sum(s => s.Ab),
                            H = g.Sum(s => s.H),
                            R = g.Sum(s => s.R),
                            D = g.Sum(s => s.C2B),
                            T = g.Sum(s => s.C3B),
                            HR = g.Sum(s => s.Hr),
                            RBI = g.Sum(s => s.Rbi),
                            SO = g.Sum(s => s.So),
                            BB = g.Sum(s => s.Bb),
                            RE = g.Sum(s => s.Re),
                            HBP = g.Sum(s => s.Hbp),
                            INTR = g.Sum(s => s.Intr),
                            SF = g.Sum(s => s.Sf),
                            SH = g.Sum(s => s.Sh),
                            SB = g.Sum(s => s.Sb),
                            CS = g.Sum(s => s.Cs),
                            LOB = g.Sum(s => s.Lob)
                        }).SingleOrDefault();
            }
            else
            {
                return (from bs in m_db.Batstatsums
                        join ts in m_db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in m_db.Teams on ts.TeamId equals t.Id
                        join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where t.Id == teamId && ls.SeasonId == seasonId
                        group bs by new { t.Id, ls.SeasonId } into g
                        select new BatStatsViewModel()
                        {
                            TeamId = teamId,
                            AB = g.Sum(s => s.Ab),
                            H = g.Sum(s => s.H),
                            R = g.Sum(s => s.R),
                            D = g.Sum(s => s.C2B),
                            T = g.Sum(s => s.C3B),
                            HR = g.Sum(s => s.Hr),
                            RBI = g.Sum(s => s.Rbi),
                            SO = g.Sum(s => s.So),
                            BB = g.Sum(s => s.Bb),
                            RE = g.Sum(s => s.Re),
                            HBP = g.Sum(s => s.Hbp),
                            INTR = g.Sum(s => s.Intr),
                            SF = g.Sum(s => s.Sf),
                            SH = g.Sum(s => s.Sh),
                            SB = g.Sum(s => s.Sb),
                            CS = g.Sum(s => s.Cs),
                            LOB = g.Sum(s => s.Lob)
                        }).SingleOrDefault();
            }
        }

        public IQueryable<ContactNameViewModel> GetPlayersWithNoGameBatStats(long gameId, long teamSeasonId)
        {
            var x = (from bs in m_db.Batstatsums
                     where bs.GameId == gameId && bs.TeamId == teamSeasonId
                     select bs.PlayerId);

            return (from rs in m_db.RosterSeasons
                    join r in m_db.Rosters on rs.PlayerId equals r.Id
                    where rs.TeamSeasonId == teamSeasonId && !rs.Inactive
                    && !x.Contains(rs.Id)
                    orderby r.Contact.LastName, r.Contact.FirstName
                    select new ContactNameViewModel()
                    {
                        Id = rs.Id,
                        FirstName = r.Contact.FirstName,
                        LastName = r.Contact.LastName,
                        MiddleName = r.Contact.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(r.Contact.Id),
                        BirthDate = r.Contact.DateOfBirth
                    });
        }

        public BatStatsViewModel GetPlayerGameBatStats(long gameId, long playerId)
        {
            return (from bs in m_db.Batstatsums
                    where bs.GameId == gameId && bs.PlayerId == playerId
                    select new BatStatsViewModel()
                    {
                        Id = bs.Id,
                        PlayerId = playerId,
                        GameId = gameId,
                        TeamId = bs.TeamId,
                        AB = bs.Ab,
                        H = bs.H,
                        R = bs.R,
                        D = bs.C2B,
                        T = bs.C3B,
                        HR = bs.Hr,
                        RBI = bs.Rbi,
                        SO = bs.So,
                        BB = bs.Bb,
                        HBP = bs.Hbp,
                        INTR = bs.Intr,
                        SF = bs.Sf,
                        SH = bs.Sh,
                        SB = bs.Sb,
                        CS = bs.Cs,
                        LOB = bs.Lob
                    }).SingleOrDefault();
        }

        private bool NeedABCheck(String fieldName)
        {
            return (fieldName == "AVG" || fieldName == "SLG" || fieldName == "OBP" || fieldName == "OPS");
        }

        private String GetBatTeamLeadersQueryString(long teamSeasonId, String fieldName)
        {
            String query = String.Empty;

            query = @"SELECT batstatsum.PlayerId, {1}
                        FROM batstatsum LEFT JOIN LeagueSchedule ON batstatsum.GameId = LeagueSchedule.Id 
                        WHERE GameStatus = 1 AND (HTeamId = {0} OR VTeamId = {0}) AND TeamId = {0}
                        GROUP BY batstatsum.PlayerId ORDER BY [FieldTotal] {2}";

            String selectStmt = BuildSelectForBatLeaders(fieldName);
            String orderBy = "DESC";

            return String.Format(query, teamSeasonId, selectStmt, orderBy);
        }

        private String GetBatLeagueLeadersQueryString(long leagueId, long divisionId, string fieldName, bool allTimeLeaders)
        {
            String query = String.Empty;

            if (allTimeLeaders)
            {
                if (divisionId == 0)
                {
                    query = @" SELECT Roster.Id AS PlayerId, 0, {1}
                            FROM batstatsum 
                            LEFT JOIN LeagueSchedule ON batstatsum.GameId = LeagueSchedule.Id 
                            LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
                            LEFT JOIN RosterSeason ON batstatsum.PlayerId = RosterSeason.Id
                            LEFT JOIN Roster ON Roster.Id = RosterSeason.PlayerId
                            WHERE GameStatus = 1 AND LeagueSeason.LeagueId = {0} AND LeagueSchedule.GameType = 0
                            GROUP BY Roster.Id ORDER BY FieldTotal {2}";
                }
                else
                {
                    query = @" SELECT Roster.Id AS PlayerId, 0, {2}
                              FROM batstatsum LEFT JOIN LeagueSchedule ON batstatsum.GameId = LeagueSchedule.Id 
                              LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
                              LEFT JOIN TeamsSeason ON batstatsum.TeamId = TeamsSeason.Id 
                              LEFT JOIN RosterSeason ON batstatsum.PlayerId = RosterSeason.Id
                              LEFT JOIN Roster ON Roster.Id = RosterSeason.PlayerId
                          WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueSeason.LeagueId = {0} AND TeamsSeason.DivisionSeasonId = {1}
                          GROUP BY Roster.Id ORDER BY FieldTotal {3}";
                }
            }
            else
            {
                if (divisionId == 0)
                {
                    query = @"SELECT batstatsum.PlayerId, batstatsum.TeamId, {1}
                            FROM batstatsum LEFT JOIN LeagueSchedule ON batstatsum.GameId = LeagueSchedule.Id 
                            WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueId = {0} 
                            GROUP BY batstatsum.PlayerId, batstatsum.TeamId ORDER BY FieldTotal {2}";
                }
                else
                {
                    query = @"SELECT batstatsum.PlayerId, batstatsum.TeamId, {2}
                          FROM batstatsum LEFT JOIN LeagueSchedule ON batstatsum.GameId = LeagueSchedule.Id 
                                          LEFT JOIN TeamsSeason ON batstatsum.TeamId = TeamsSeason.Id 
                          WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueId = {0} AND TeamsSeason.DivisionSeasonId = {1}
                          GROUP BY batstatsum.PlayerId, batstatsum.TeamId ORDER BY FieldTotal {3}";

                }
            }

            String selectStmt = BuildSelectForBatLeaders(fieldName);
            String orderBy = "DESC";

            if (divisionId != 0)
                return String.Format(query, leagueId, divisionId, selectStmt, orderBy);
            else
                return String.Format(query, leagueId, selectStmt, orderBy);
        }

        private String BuildSelectForBatLeaders(String fieldName)
        {
            String selectStmt = String.Empty;
            if (fieldName == "AVG")
            {
                selectStmt = "SUM(AB) + 0.00 as CheckField, (SUM(H)+0.00)/nullif(SUM(AB),0) AS FieldTotal";
            }
            else if (fieldName == "SLG")
            {
                selectStmt = "SUM(AB) + 0.00 as CheckField, (SUM([2B]) * 2 + SUM([3B]) * 3 + SUM(HR) * 4 + (SUM(H) - SUM([2B]) - SUM([3B]) - SUM(HR)) + 0.00) / nullif(SUM(AB),0) AS FieldTotal";
            }
            else if (fieldName == "OPS")
            {
                selectStmt = "SUM(AB) + 0.00 as CheckField, (((SUM([2B]) * 2 + SUM([3B]) * 3 + SUM(HR) * 4 + (SUM(H) - SUM([2B]) - SUM([3B]) - SUM(HR)) + 0.00) / nullif(SUM(AB),0)) + ((SUM(H) + SUM(BB) + SUM(HBP) + 0.00)/nullif(SUM(AB) + SUM(BB) + SUM(HBP),0))) AS FieldTotal";
            }
            else if (fieldName == "TB")
            {
                selectStmt = "(SUM([2B]) * 2 + SUM([3B]) * 3 + SUM(HR) * 4 + (SUM(H) - SUM([2B]) - SUM([3B]) - SUM(HR)) + 0.00) AS FieldTotal";
            }
            else if (fieldName == "PA")
            {
                selectStmt = "(SUM(AB) + SUM(BB) + SUM(HBP) + SUM(SH) + SUM(SF) + SUM(INTR) + 0.00) AS FieldTotal";
            }
            else if (fieldName == "OBP")
            {
                selectStmt = "SUM(AB) + 0.00 as CheckField, ((SUM(H) + SUM(BB) + SUM(HBP) + 0.00)/nullif(SUM(AB) + SUM(BB) + SUM(HBP),0)) AS FieldTotal";
            }
            else
            {
                selectStmt = String.Format("SUM([{0}]) + 0.0 AS FieldTotal", fieldName);
            }

            return selectStmt;
        }
    }
}