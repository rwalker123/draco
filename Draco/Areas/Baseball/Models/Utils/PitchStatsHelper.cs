using ModelObjects;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;
using System.Text;

namespace SportsManager.Utils
{
    public class PitchStatsHelper : StatsHelper
    {
        public PitchStatsHelper(DB db) : base(db)
        {
        }

        private static List<LeaderCategory> m_pitchCats = new List<LeaderCategory>()
                {
                    new LeaderCategory() {
                        Name = "W",
                        Id = "W"
                    },
                    new LeaderCategory() {
                        Name = "S",
                        Id = "S"
                    },
                    new LeaderCategory() {
                        Name = "IP",
                        Id = "IP",
                        NumDecimals = 1
                    },
                    new LeaderCategory() {
                        Name = "BF",
                        Id = "BF"
                    },
                    new LeaderCategory() {
                        Name = "H",
                        Id = "H"
                    },
                    new LeaderCategory() {
                        Name = "R",
                        Id = "R&calcMinIP=1"
                    },
                    new LeaderCategory() {
                        Name = "ER",
                        Id = "ER&calcMinIP=1"
                    },
                    new LeaderCategory() {
                        Name = "SO",
                        Id = "SO"
                    },
                    new LeaderCategory() {
                        Name = "K9",
                        Id = "K9&calcMinIP=1",
                        NumDecimals = 1
                    },
                    new LeaderCategory() {
                        Name = "BB9",
                        Id = "BB9&calcMinIP=1",
                        NumDecimals = 1
                    },
                    new LeaderCategory() {
                        Name = "OBA",
                        Id = "OBA&calcMinIP=1",
                        NumDecimals = 3
                    },
                    new LeaderCategory() {
                        Name = "SLG",
                        Id = "SLG&calcMinIP=1",
                        NumDecimals = 3
                    },
                    new LeaderCategory() {
                        Name = "WHIP",
                        Id = "WHIP&calcMinIP=1",
                        NumDecimals = 2
                    },
                    new LeaderCategory() {
                        Name = "ERA",
                        Id = "ERA&calcMinIP=1",
                        NumDecimals = 2
                    }
                };


        public static IEnumerable<LeaderCategory> AvailablePitchCategories()
        {
            return m_pitchCats;
        }

        public List<LeagueLeaderStatViewModel> GetPitchLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minIP, bool allTimeLeaders)
        {
            var stats = new List<LeagueLeaderStatViewModel>();

            bool ipCheck = NeedIPCheck(fieldName);

            String queryString = GetPitchLeagueLeadersQueryString(leagueId, divisionId, fieldName, allTimeLeaders);

            var result = m_db.Database.SqlQuery<LeaderStatRecord>(queryString, new object[] { }).AsQueryable();
            return ProcessLeaders(result, fieldName, allTimeLeaders, limitRecords, ipCheck, minIP);
        }

        public IQueryable<PitchStatsViewModel> GetPitchLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats)
        {
            var queryString = GetPitchOrderedStats(leagueId, sortField, sortOrder, historicalStats);
            if (historicalStats)
                return m_db.Database.SqlQuery<CareerPitchStatsViewModel>(queryString, new object[] { }).AsQueryable();
            else
                return m_db.Database.SqlQuery<PitchStatsViewModel>(queryString, new object[] { }).AsQueryable();
        }

        public IQueryable<PitchStatsViewModel> GetPitchLeaguePlayerTotals(long leagueId, long divisionId, string sortField, string sortOrder)
        {
            var queryString = GetPitchOrderedStats(leagueId, divisionId, sortField, sortOrder);
            return m_db.Database.SqlQuery<PitchStatsViewModel>(queryString, new object[] { }).AsQueryable();
        }

        public IQueryable<GamePitchStats> GetPitchGameStats(long gameId, long teamId)
        {
            return (from ps in m_db.Pitchstatsums
                    where ps.GameId == gameId && ps.TeamId == teamId
                    select ps);
        }

        public List<LeagueLeaderStatViewModel> GetPitchTeamLeaders(long teamSeasonId, string fieldName, int limitRecords, int minIP)
        {
            var stats = new List<LeagueLeaderStatViewModel>();

            bool ipCheck = NeedIPCheck(fieldName);

            String queryString = GetPitchTeamLeadersQueryString(teamSeasonId, fieldName);

            var result = m_db.Database.SqlQuery<LeaderStatRecord>(queryString, new object[] { }).AsQueryable();
            return ProcessLeaders(result, fieldName, false, limitRecords, ipCheck, minIP);
        }

        public IQueryable<CareerPitchStatsViewModel> GetPitchPlayerCareer(long playerId, bool fromSeason)
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

            return (from rs in m_db.RosterSeasons
                    join ts in m_db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join t in m_db.Teams on ts.TeamId equals t.Id
                    join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join s in m_db.Seasons on ls.SeasonId equals s.Id
                    join l in m_db.Leagues on ls.LeagueId equals l.Id
                    join bss in m_db.Pitchstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId && bss.Id != 0
                    group new { bss, s, l, ts } by new { bss.PlayerId, seasonName = s.Name, leagueName = l.Name, teamName = ts.Name } into g
                    orderby g.Key.seasonName, g.Key.leagueName, g.Key.teamName
                    select new CareerPitchStatsViewModel()
                    {
                        Id = g.Key.PlayerId,
                        SeasonName = g.Key.seasonName,
                        TeamName = g.Key.teamName,
                        LeagueName = g.Key.leagueName,
                        IP = g.Sum(b => b.bss.Ip),
                        IP2 = g.Sum(b => b.bss.Ip2),
                        BF = g.Sum(b => b.bss.Bf),
                        W = g.Sum(b => b.bss.W),
                        L = g.Sum(b => b.bss.L),
                        S = g.Sum(b => b.bss.S),
                        H = g.Sum(b => b.bss.H),
                        R = g.Sum(b => b.bss.R),
                        ER = g.Sum(b => b.bss.Er),
                        D = g.Sum(b => b.bss.C2B),
                        T = g.Sum(b => b.bss.C3B),
                        HR = g.Sum(b => b.bss.Hr),
                        SO = g.Sum(b => b.bss.So),
                        BB = g.Sum(b => b.bss.Bb),
                        WP = g.Sum(b => b.bss.Wp),
                        HBP = g.Sum(b => b.bss.Hbp),
                        BK = g.Sum(b => b.bss.Bk),
                        SC = g.Sum(b => b.bss.Sc)
                    });

        }

        public CareerPitchStatsViewModel GetPitchPlayerCareerTotal(long playerId, bool fromSeason)
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

            return (from rs in m_db.RosterSeasons
                    join bss in m_db.Pitchstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId
                    group new { rs, bss } by rs.PlayerId into g
                    select new CareerPitchStatsViewModel()
                    {
                        Id = g.Key,
                        IP = g.Sum(b => b.bss.Ip),
                        IP2 = g.Sum(b => b.bss.Ip2),
                        BF = g.Sum(b => b.bss.Bf),
                        W = g.Sum(b => b.bss.W),
                        L = g.Sum(b => b.bss.L),
                        S = g.Sum(b => b.bss.S),
                        H = g.Sum(b => b.bss.H),
                        R = g.Sum(b => b.bss.R),
                        ER = g.Sum(b => b.bss.Er),
                        D = g.Sum(b => b.bss.C2B),
                        T = g.Sum(b => b.bss.C3B),
                        HR = g.Sum(b => b.bss.Hr),
                        SO = g.Sum(b => b.bss.So),
                        BB = g.Sum(b => b.bss.Bb),
                        WP = g.Sum(b => b.bss.Wp),
                        HBP = g.Sum(b => b.bss.Hbp),
                        BK = g.Sum(b => b.bss.Bk),
                        SC = g.Sum(b => b.bss.Sc),
                    }).SingleOrDefault();
        }

        public IQueryable<PitchStatsViewModel> GetPitchTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
        {
            // filters not implemented yet...
            //case 2: // vs. Team
            //    myCommand = new SqlCommand("dbo.GetPitchTeamPlayerTotalsVsTeam", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
            //    break;
            //case 3: // vs. Division
            //    myCommand = new SqlCommand("dbo.GetPitchTeamPlayerTotalsVsDivision", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
            //    break;
            //case 4: // Single Game
            //    myCommand = new SqlCommand("dbo.GetPitchTeamPlayerTotalsByGame", myConnection);
            //    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
            //    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
            //    break;

            ///****** Object:  StoredProcedure [dbo].[GetPitchTeamPlayerTotals]    Script Date: 10/12/2010 20:22:03 ******/
            //SET ANSI_NULLS ON
            //GO
            //SET QUOTED_IDENTIFIER OFF
            //GO
            //CREATE PROCEDURE [dbo].[GetPitchTeamPlayerTotals]( @teamId bigint )
            //AS
            //    DECLARE @zeroField bigint
            //    SET @zeroField = 0

            //    SELECT pitchstatsum.PlayerID, SUM(IP) as IP, SUM(IP2) as IP2, SUM(BF) as BF, SUM(W) as W, SUM(L) as L, SUM(S) as S, SUM(H) as H, SUM(R) as R, SUM(ER) as ER, SUM([2B]) as [2B], SUM([3B]) as [3B], SUM(HR) as HR, SUM(SO) as SO, SUM(BB) as BB, SUM(WP) as WP, SUM(HBP) as HBP, SUM(BK) as BK, SUM(SC) as SC, @zeroField
            //    FROM pitchstatsum 
            //    WHERE TeamId = @teamId GROUP BY PlayerId
            //GO
            var queryString = GetTeamPitchOrderedStats(teamId, sortField, sortOrder, historicalStats);
            if (historicalStats)
                return m_db.Database.SqlQuery<CareerPitchStatsViewModel>(queryString, new object[] { }).AsQueryable();
            else
                return m_db.Database.SqlQuery<PitchStatsViewModel>(queryString, new object[] { }).AsQueryable();
        }

        public PitchStatsViewModel GetPitchGameTotals(long gameId, long teamId)
        {
            return (from bs in m_db.Pitchstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    group bs by new { bs.GameId, bs.TeamId } into g
                    select new PitchStatsViewModel()
                    {
                        GameId = gameId,
                        TeamId = teamId,
                        W = g.Sum(s => s.W),
                        L = g.Sum(s => s.L),
                        S = g.Sum(s => s.S),
                        H = g.Sum(s => s.H),
                        D = g.Sum(s => s.C2B),
                        T = g.Sum(s => s.C3B),
                        HR = g.Sum(s => s.Hr),
                        SO = g.Sum(s => s.So),
                        BB = g.Sum(s => s.Bb),
                        HBP = g.Sum(s => s.Hbp),
                        BF = g.Sum(s => s.Bf),
                        BK = g.Sum(s => s.Bk),
                        IP = g.Sum(s => s.Ip),
                        IP2 = g.Sum(s => s.Ip2),
                        R = g.Sum(s => s.R),
                        ER = g.Sum(s => s.Er),
                        SC = g.Sum(s => s.Sc)
                    }).SingleOrDefault();

        }

        public PitchStatsViewModel GetPitchTeamSeasonTotals(long teamSeasonId, long seasonId)
        {
            var teamId = (from ts in m_db.TeamsSeasons
                          where ts.Id == teamSeasonId
                          select ts.TeamId).SingleOrDefault();

            if (seasonId == 0)
            {
                return (from bs in m_db.Pitchstatsums
                        join ts in m_db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in m_db.Teams on ts.TeamId equals t.Id
                        where t.Id == teamId
                        group bs by t.Id into g
                        select new PitchStatsViewModel()
                        {
                            TeamId = teamId,
                            W = g.Sum(s => s.W),
                            L = g.Sum(s => s.L),
                            S = g.Sum(s => s.S),
                            H = g.Sum(s => s.H),
                            D = g.Sum(s => s.C2B),
                            T = g.Sum(s => s.C3B),
                            HR = g.Sum(s => s.Hr),
                            SO = g.Sum(s => s.So),
                            BB = g.Sum(s => s.Bb),
                            HBP = g.Sum(s => s.Hbp),
                            BF = g.Sum(s => s.Bf),
                            BK = g.Sum(s => s.Bk),
                            IP = g.Sum(s => s.Ip),
                            IP2 = g.Sum(s => s.Ip2),
                            R = g.Sum(s => s.R),
                            ER = g.Sum(s => s.Er),
                            SC = g.Sum(s => s.Sc)
                        }).SingleOrDefault();
            }
            else
            {
                return (from bs in m_db.Pitchstatsums
                        join ts in m_db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in m_db.Teams on ts.TeamId equals t.Id
                        join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where t.Id == teamId && ls.SeasonId == seasonId
                        group bs by new { t.Id, ls.SeasonId } into g
                        select new PitchStatsViewModel()
                        {
                            TeamId = teamId,
                            W = g.Sum(s => s.W),
                            L = g.Sum(s => s.L),
                            S = g.Sum(s => s.S),
                            H = g.Sum(s => s.H),
                            D = g.Sum(s => s.C2B),
                            T = g.Sum(s => s.C3B),
                            HR = g.Sum(s => s.Hr),
                            SO = g.Sum(s => s.So),
                            BB = g.Sum(s => s.Bb),
                            HBP = g.Sum(s => s.Hbp),
                            BF = g.Sum(s => s.Bf),
                            BK = g.Sum(s => s.Bk),
                            IP = g.Sum(s => s.Ip),
                            IP2 = g.Sum(s => s.Ip2),
                            R = g.Sum(s => s.R),
                            ER = g.Sum(s => s.Er),
                            SC = g.Sum(s => s.Sc)
                        }).SingleOrDefault();
            }
        }

        public IQueryable<ContactNameViewModel> GetPlayersWithNoGamePitchStats(long gameId, long teamSeasonId)
        {
            var x = (from bs in m_db.Pitchstatsums
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

        public PitchStatsViewModel GetPlayerGamePitchStats(long gameId, long playerId)
        {
            return (from bs in m_db.Pitchstatsums
                    where bs.GameId == gameId && bs.PlayerId == playerId
                    select new PitchStatsViewModel()
                    {
                        Id = bs.Id,
                        PlayerId = playerId,
                        GameId = gameId,
                        TeamId = bs.TeamId,
                        IP = bs.Ip,
                        IP2 = bs.Ip2,
                        BF = bs.Bf,
                        W = bs.W,
                        L = bs.L,
                        S = bs.S,
                        H = bs.H,
                        R = bs.R,
                        ER = bs.Er,
                        D = bs.C2B,
                        T = bs.C3B,
                        HR = bs.Hr,
                        SO = bs.So,
                        BB = bs.Bb,
                        WP = bs.Wp,
                        HBP = bs.Hbp,
                        BK = bs.Bk,
                        SC = bs.Sc
                    }).SingleOrDefault();
        }

        private String GetPitchTeamLeadersQueryString(long teamSeasonId, String fieldName)
        {
            String query;

            query = @"SELECT pitchstatsum.PlayerId, {1}
                          FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id
                          WHERE GameStatus = 1 AND (HTeamId = {0} OR VTeamId = {0}) AND TeamId = {0}
                          GROUP BY pitchstatsum.PlayerId ORDER BY FieldTotal {2}";

            String orderBy = "DESC";
            String selectStmt = BuildSelectForPitchLeaders(fieldName, out orderBy);

            return String.Format(query, teamSeasonId, selectStmt, orderBy);

        }


        private bool NeedIPCheck(String fieldName)
        {
            return (fieldName == "ERA" || fieldName == "WHIP" || fieldName == "K9" || fieldName == "BB9"
                            || fieldName == "SLG" || fieldName == "OBA" || fieldName == "TB"
                            || fieldName == "R" || fieldName == "ER");
        }

        private const String pitchStatsBaseSelect = "SELECT PlayerId as PlayerId, SUM(IP) as IP, SUM(IP2) as IP2, SUM(BF) as BF, SUM(W) as W, SUM(L) as L, SUM(S) as S, SUM(H) as H, SUM(R) as R, SUM(ER) as ER, SUM([2B]) as D, SUM([3B]) as T, SUM(HR) as HR, SUM(SO) as SO, SUM(BB) as BB, SUM(WP) as WP, SUM(HBP) as HBP, SUM(BK) as BK, SUM(SC) as SC, ";
        private const String pitchStatsStandardSelect = pitchStatsBaseSelect + " {0} ";
        private const String pitchStatsTeamStandardSelect = pitchStatsBaseSelect + " TeamId, {0}, Contact.FirstName, Contact.MiddleName, Contact.LastName";

        private String GetTeamPitchOrderedStats(long teamId, string fieldName, string orderBy, bool isHistorical)
        {
            StringBuilder query = new StringBuilder();

            query.Append(pitchStatsTeamStandardSelect);

            if (isHistorical)
            {
                query.Append(@"FROM pitchstatsum 
                                LEFT JOIN RosterSeason on pitchstatsum.PlayerId = RosterSeason.Id
                                LEFT JOIN Roster on RosterSeason.PlayerId = Roster.Id
                                LEFT JOIN Contact on Roster.ContactId = Contact.Id
                                LEFT JOIN TeamSeason on pitchstatsum.TeamId = TeamSeason.Id");
                query.Append("WHERE TeamSeason.TeamId = {1} ");
            }
            else
            {
                query.Append("FROM pitchstatsum ");
                query.Append("WHERE TeamId = {1} ");
            }

            query.Append("GROUP BY TeamId, PlayerId ORDER BY FieldTotal {2} ");

            var defaultOrderBy = "DESC"; // not used.
            var selectStmt = BuildSelectForPitchLeaders(fieldName, out defaultOrderBy);

            return String.Format(query.ToString(), selectStmt, teamId, orderBy);

        }


        private String GetPitchOrderedStats(long leagueId, string fieldName, string orderBy, bool isHistorical)
        {
            StringBuilder query = new StringBuilder();

            query.Append(pitchStatsStandardSelect);

            if (isHistorical)
            {
                query.Append(@"FROM pitchstatsum LEFT JOIN RosterSeason on pitchstatsum.PlayerId = RosterSeason.Id
                               LEFT JOIN LeagueSchedule on pitchstatsum.GameId = LeagueSchedule.Id
                               LEFT JOIN LeagueSeason on LeagueSchedule.LeagueId = LeagueSeason.Id ");
            }
            else
            {
                query.Append("FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id ");
            }

            query.Append("WHERE GameStatus = 1 AND LeagueSchedule.LeagueId = {1} ");
            query.Append("GROUP BY PlayerId ORDER BY FieldTotal {2} ");

            var defaultOrderBy = "DESC"; // not used.
            var selectStmt = BuildSelectForPitchLeaders(fieldName, out defaultOrderBy);

            return String.Format(query.ToString(), selectStmt, leagueId, orderBy);

        }

        private String GetPitchOrderedStats(long leagueId, long divisionId, string fieldName, string orderBy)
        {
            StringBuilder query = new StringBuilder();

            query.Append(pitchStatsStandardSelect);

            query.Append(@"FROM pitchstatsum 
                                LEFT JOIN LeagueSchedule on pitchstatsum.GameId = LeagueSchedule.Id
                                LEFT JOIN TeamSeason on pitchstatsum.TeamId = TeamSeason.Id
                           ");

            query.Append("WHERE GameStatus = 1 AND LeagueSchedule.LeagueId = {1} && TeamSeason.DivisionSeasonId = {2}");
            query.Append("GROUP BY RosterSeason.PlayerId ORDER BY FieldTotal {3} ");

            var defaultOrderBy = "DESC"; // not used.
            var selectStmt = BuildSelectForPitchLeaders(fieldName, out defaultOrderBy);

            return String.Format(query.ToString(), selectStmt, leagueId, divisionId, orderBy);

        }

        private String GetPitchLeagueLeadersQueryString(long leagueId, long divisionId, string fieldName, bool allTimeLeaders)
        {
            String query = String.Empty;

            if (allTimeLeaders)
            {
                if (divisionId == 0)
                {
                    query = @"SELECT Roster.Id AS PlayerId, 0, {1}
                          FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id
                                          LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
                                          LEFT JOIN RosterSeason ON pitchstatsum.PlayerId = RosterSeason.Id
                                          LEFT JOIN Roster ON Roster.Id = RosterSeason.PlayerId
                          WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueSeason.LeagueId = {0} 
                          GROUP BY Roster.Id ORDER BY FieldTotal {2}";

                }
                else
                {
                    query = @"SELECT Roster.Id, 0, {2}
                               FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id
                                    LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
                                    LEFT JOIN TeamsSeason ON pitchstatsum.TeamId = TeamsSeason.Id 
                                    LEFT JOIN RosterSeason ON pitchstatsum.PlayerId = RosterSeason.Id
                                    LEFT JOIN Roster ON Roster.Id = RosterSeason.PlayerId
                            WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueSeason.LeagueId = {0} AND TeamsSeason.DivisionSeasonId = {1} 
                            GROUP BY Roster.Id ORDER BY FieldTotal {3}";
                }
            }
            else
            {
                if (divisionId == 0)
                {
                    query = @"SELECT pitchstatsum.PlayerId, pitchstatsum.TeamId, {1}
                            FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id
                            WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueId = {0}
                            GROUP BY pitchstatsum.PlayerId, pitchstatsum.TeamId ORDER BY FieldTotal {2}";
                }
                else
                {
                    query = @"SELECT pitchstatsum.PlayerId, pitchstatsum.TeamId, {2}
                            FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id 
                                              LEFT JOIN TeamsSeason ON pitchstatsum.TeamId = TeamsSeason.Id 
                            WHERE GameStatus = 1 AND LeagueSchedule.GameType = 0 AND LeagueId = {0} AND TeamsSeason.DivisionSeasonId = {1}
                            GROUP BY pitchstatsum.PlayerId, pitchstatsum.TeamId ORDER BY FieldTotal {3}";
                }
            }

            String orderBy = "DESC";
            String selectStmt = BuildSelectForPitchLeaders(fieldName, out orderBy);

            if (divisionId != 0)
                return String.Format(query, leagueId, divisionId, selectStmt, orderBy);
            else
                return String.Format(query, leagueId, selectStmt, orderBy);
        }

        private String BuildSelectForPitchLeaders(String fieldName, out String orderBy)
        {
            orderBy = "DESC";

            String selectStmt = String.Empty;

            // default query but different orderby.
            if (fieldName == "R" || fieldName == "ER")
                orderBy = "ASC";

            if (fieldName == "ERA")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, (SUM(ER)*9.0)/nullif(SUM(IP)+SUM(IP2)/3.0, 0) + 0.000 AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "WHIP")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, (SUM(BB) + SUM(H))/nullif(SUM(IP)+SUM(IP2)/3.0, 0) + 0.000 AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "K9")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, SUM(SO)/nullif((SUM(IP)+SUM(IP2)/3.0), 0) * 9.0 AS FieldTotal";
            }
            else if (fieldName == "BB9")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, SUM(BB)/nullif((SUM(IP)+SUM(IP2)/3.0), 0) * 9.0 AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "SLG")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, (SUM([2B]) * 2 + SUM([3B]) * 3 + SUM(HR) * 4 + (SUM(H) - SUM([2B]) - SUM([3B]) - SUM(HR)) + 0.00) / nullif(SUM(BF) - SUM(BB) - SUM(HBP) - SUM(SC),0) AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "OBA")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, (SUM(H) + 0.00) / nullif(SUM(BF) - SUM(BB) - SUM(HBP) - SUM(SC),0) AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "TB")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3.0) + 0.0 AS CheckField, SUM([2B] * 2 + SUM([3B]) * 3 + SUM(HR) * 4 + (SUM(H) - SUM([2B]) - SUM([3B]) - SUM(HR)) + 0.00) AS FieldTotal";
                orderBy = "ASC";
            }
            else if (fieldName == "IP")
            {
                selectStmt = "SUM(IP)+(SUM(IP2)/3)+((SUM(IP2)%3)/10.0) + 0.0 AS FieldTotal";
            }
            else
            {
                selectStmt = String.Format("SUM([{0}]) + 0.0 AS FieldTotal", fieldName);
            }

            return selectStmt;
        }
    }
}