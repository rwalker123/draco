using ModelObjects;
using SportsManager;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Linq.Dynamic;


namespace DataAccess
{
    /// <summary>
    /// Summary description for GameStats
    /// </summary>
    static public class GameStats
    {
        static public IQueryable<ContactName> GetPlayersWithNoGameBatStats(long gameId, long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            var x = (from bs in db.batstatsums
                         where bs.GameId == gameId && bs.TeamId == teamSeasonId
                         select bs.PlayerId);

            return (from rs in db.RosterSeasons
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    where rs.TeamSeasonId == teamSeasonId && !rs.Inactive
                    && !x.Contains(rs.Id)
                    orderby r.Contact.LastName, r.Contact.FirstName
                    select new ContactName(rs.Id, r.Contact.FirstName, r.Contact.LastName, r.Contact.MiddleName, Contact.GetPhotoURL(r.Contact.Id)));
        }

        static public GameBatStats GetPlayerGameBatStats(long gameId, long playerId)
        {
            DB db = DBConnection.GetContext();

            return (from bs in db.batstatsums
                    where bs.GameId == gameId && bs.PlayerId == playerId
                    select new GameBatStats()
                    {
                        Id = bs.Id,
                        PlayerId = playerId,
                        GameId = gameId,
                        TeamId = bs.TeamId,
                        AB = bs.AB,
                        H = bs.H,
                        R = bs.R,
                        D = bs._2B,
                        T = bs._3B,
                        HR = bs.HR,
                        RBI = bs.RBI,
                        SO = bs.SO,
                        BB = bs.BB,
                        HBP = bs.HBP,
                        INTR = bs.INTR,
                        SF = bs.SF,
                        SH = bs.SH,
                        SB = bs.SB,
                        CS = bs.CS,
                        LOB = bs.LOB,
                        AVG = 0,
                        OBA = 0,
                        OPS = 0,
                        PA = 0,
                        SLG = 0,
                        TB = 0
                    }).SingleOrDefault();
        }

        static public IQueryable<ContactName> GetPlayersWithNoGamePitchStats(long gameId, long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            var x = (from bs in db.pitchstatsums
                     where bs.GameId == gameId && bs.TeamId == teamSeasonId
                     select bs.PlayerId);

            return (from rs in db.RosterSeasons
                    join r in db.Rosters on rs.PlayerId equals r.Id
                    where rs.TeamSeasonId == teamSeasonId && !rs.Inactive
                    && !x.Contains(rs.Id)
                    orderby r.Contact.LastName, r.Contact.FirstName
                    select new ContactName(rs.Id, r.Contact.FirstName, r.Contact.LastName, r.Contact.MiddleName, Contact.GetPhotoURL(r.Contact.Id)));
        }

        static public GamePitchStats GetPlayerGamePitchStats(long gameId, long playerId)
        {
            DB db = DBConnection.GetContext();

            return (from bs in db.pitchstatsums
                    where bs.GameId == gameId && bs.PlayerId == playerId
                    select new GamePitchStats()
                    {
                        Id = bs.Id,
                        PlayerId = playerId,
                        GameId = gameId,
                        TeamId = bs.TeamId,
                        IP = bs.IP,
                        IP2 = bs.IP2,
                        BF = bs.BF,
                        W = bs.W,
                        L = bs.L,
                        S = bs.S,
                        H = bs.H,
                        R = bs.R,
                        ER = bs.ER,
                        D = bs._2B,
                        T = bs._3B,
                        HR = bs.HR,
                        SO = bs.SO,
                        BB = bs.BB,
                        WP = bs.WP,
                        HBP = bs.HBP,
                        BK = bs.BK,
                        SC = bs.SC,
                        ERA = 0,
                        AB = 0,
                        BB9 = 0,
                        IPDecimal = 0,
                        WHIP = 0,
                        TB = 0,
                        K9 = 0,
                        OBA = 0,
                        SLG = 0
                    }).SingleOrDefault();
        }

        static public GameBatStats GetBatTeamTotals(long teamId, int filter, long filterData)
        {
            GameBatStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;

                    switch (filter)
                    {
                        case 2: // vs. Team
                            myCommand = new SqlCommand("dbo.GetBatTeamTotalsVsTeam", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 3: // vs. Division
                            myCommand = new SqlCommand("dbo.GetBatTeamTotalsVsDivision", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 4: // Single Game
                            myCommand = new SqlCommand("dbo.GetBatTeamTotalsByGame", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 1: // No Filter
                        default:
                            myCommand = new SqlCommand("dbo.GetBatTeamTotals", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                    {
                        stats = new GameBatStats(0, 0, 0, teamId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16));
                    }

                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GamePitchStats GetPitchTeamTotals(long teamId, int filter, long filterData)
        {
            GamePitchStats stats = null;


            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;

                    switch (filter)
                    {
                        case 2: // vs. Team
                            myCommand = new SqlCommand("dbo.GetPitchTeamTotalsVsTeam", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 3: // vs. Division
                            myCommand = new SqlCommand("dbo.GetPitchTeamTotalsVsDivision", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 4: // Single Game
                            myCommand = new SqlCommand("dbo.GetPitchTeamTotalsByGame", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 1: // No Filter
                        default:
                            myCommand = new SqlCommand("dbo.GetPitchTeamTotals", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GamePitchStats(0, 0, 0, teamId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GameFieldStats GetFieldTeamTotalsByPos(long teamId, int pos, int filter, long filterData)
        {
            GameFieldStats stats = null;

            try
            {

                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;

                    switch (filter)
                    {
                        case 2: // vs. team
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsTeamByPos", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = pos;
                            break;
                        case 3: // vs. division
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsDivisionByPos", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = pos;
                            break;
                        case 4: // single game
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsByGameByPos", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = pos;
                            break;
                        case 1:
                        default:
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsByPos", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = pos;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameFieldStats(0, 0, 0, teamId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GameFieldStats getFieldTeamTotalsByPlayer(long teamId, long playerId, int filter, long filterData)
        {
            GameFieldStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;

                    switch (filter)
                    {
                        case 2: // vs. team
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsTeamByPlayer", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
                            break;
                        case 3: // vs. division
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsDivisionByPlayer", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
                            break;
                        case 4: // single game
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsByGameByPlayer", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
                            break;
                        case 1:
                        default:
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsByPlayer", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameFieldStats(0, 0, 0, teamId, 0, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GameFieldStats getFieldTeamTotals(long teamId, int filter, long filterData)
        {
            GameFieldStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;
                    switch (filter)
                    {
                        case 2: // vs. team
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsTeam", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 3: // vs. division
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsVsDivision", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 4: // single game
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotalsByGame", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 1:
                        default:
                            myCommand = new SqlCommand("dbo.GetFieldTeamTotals", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameFieldStats(0, 0, 0, teamId, 0, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="teamId">If historicalStats == true then this is a TeamId otherwise a TeamSeasonId</param>
        /// <param name="sortField"></param>
        /// <param name="sortOrder"></param>
        /// <param name="historicalStats"></param>
        /// <returns></returns>
        static public IQueryable<GameBatStats> GetBatTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
        {
            // begin to move to Linq...only for no filter for now.
            DB db = DBConnection.GetContext();

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
                return (from bss in db.batstatsums
                        join rs in db.RosterSeasons on bss.PlayerId equals rs.Id
                        join ts in db.TeamsSeasons on bss.TeamId equals ts.Id
                        where ts.TeamId == teamId
                        group bss by rs.PlayerId into g
                        let ab = g.Sum(b => b.AB)
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.BB)
                        let hbp = g.Sum(b => b.HBP)
                        let d = g.Sum(b => b._2B)
                        let t = g.Sum(b => b._3B)
                        let hr = g.Sum(b => b.HR)
                        let sh = g.Sum(b => b.SH)
                        let sf = g.Sum(b => b.SF)
                        let intr = g.Sum(b => b.INTR)
                        let oba = (ab + bb + hbp) > 0 ? (double)(h + bb + hbp) / (double)(ab + bb + hbp) : 0.00
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                        select new GameCareerBatStats
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            AB = ab,
                            H = h,
                            R = g.Sum(b => b.R),
                            D = d,
                            T = t,
                            HR = hr,
                            RBI = g.Sum(b => b.RBI),
                            SO = g.Sum(b => b.SO),
                            BB = bb,
                            RE = g.Sum(b => b.RE),
                            HBP = hbp,
                            INTR = intr,
                            SF = sf,
                            SH = sh,
                            SB = g.Sum(b => b.SB),
                            CS = g.Sum(b => b.CS),
                            LOB = g.Sum(b => b.LOB),
                            AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                            OBA = oba,
                            OPS = slg + oba,
                            PA = ab + bb + hbp + sh + sf + intr,
                            SLG = slg,
                            TB = tb
                        }).OrderBy(sortField + " " + sortOrder);
            }
            else
            {
                return (from bss in db.batstatsums
                        where bss.TeamId == teamId
                        group bss by bss.PlayerId into g
                        let ab = g.Sum(b => b.AB)
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.BB)
                        let hbp = g.Sum(b => b.HBP)
                        let d = g.Sum(b => b._2B)
                        let t = g.Sum(b => b._3B)
                        let hr = g.Sum(b => b.HR)
                        let sh = g.Sum(b => b.SH)
                        let sf = g.Sum(b => b.SF)
                        let intr = g.Sum(b => b.INTR)
                        let oba = (ab + bb + hbp) > 0 ? (double)(h + bb + hbp) / (double)(ab + bb + hbp) : 0.00
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                        select new GameBatStats
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            AB = ab,
                            H = h,
                            R = g.Sum(b => b.R),
                            D = d,
                            T = t,
                            HR = hr,
                            RBI = g.Sum(b => b.RBI),
                            SO = g.Sum(b => b.SO),
                            BB = bb,
                            RE = g.Sum(b => b.RE),
                            HBP = hbp,
                            INTR = intr,
                            SF = sf,
                            SH = sh,
                            SB = g.Sum(b => b.SB),
                            CS = g.Sum(b => b.CS),
                            LOB = g.Sum(b => b.LOB),
                            AVG =  ab > 0 ? (double)h / (double)ab : 0.000,
                            OBA = oba,
                            OPS = slg + oba,
                            PA = ab + bb + hbp + sh + sf + intr,
                            SLG = slg,
                            TB = tb
                        }).OrderBy(sortField + " " + sortOrder);

            }
        }

        static public GameBatStats GetBatTeamSeasonTotals(long teamSeasonId, long seasonId)
        {
            DB db = DBConnection.GetContext();

            var teamId = (from ts in db.TeamsSeasons
                          where ts.Id == teamSeasonId
                          select ts.TeamId).SingleOrDefault();

            if (seasonId == 0)
            {
                return (from bs in db.batstatsums
                        join ts in db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in db.Teams on ts.TeamId equals t.Id
                        where t.Id == teamId
                        group bs by t.Id into g
                        select new GameBatStats()
                        {
                            TeamId = teamId,
                            AB = g.Sum(s => s.AB),
                            H = g.Sum(s => s.H),
                            R = g.Sum(s => s.R),
                            D = g.Sum(s => s._2B),
                            T = g.Sum(s => s._3B),
                            HR = g.Sum(s => s.HR),
                            RBI = g.Sum(s => s.RBI),
                            SO = g.Sum(s => s.SO),
                            BB = g.Sum(s => s.BB),
                            RE = g.Sum(s => s.RE),
                            HBP = g.Sum(s => s.HBP),
                            INTR = g.Sum(s => s.INTR),
                            SF = g.Sum(s => s.SF),
                            SH = g.Sum(s => s.SH),
                            SB = g.Sum(s => s.SB),
                            CS = g.Sum(s => s.CS),
                            LOB = g.Sum(s => s.LOB),
                            AVG = 0,
                            OBA = 0,
                            OPS = 0,
                            PA = 0,
                            SLG = 0,
                            TB = 0
                        }).SingleOrDefault();
            }
            else
            {
                return (from bs in db.batstatsums
                        join ts in db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in db.Teams on ts.TeamId equals t.Id
                        join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where t.Id == teamId && ls.SeasonId == seasonId
                        group bs by new { t.Id, ls.SeasonId } into g
                        select new GameBatStats()
                        {
                            TeamId = teamId,
                            AB = g.Sum(s => s.AB),
                            H = g.Sum(s => s.H),
                            R = g.Sum(s => s.R),
                            D = g.Sum(s => s._2B),
                            T = g.Sum(s => s._3B),
                            HR = g.Sum(s => s.HR),
                            RBI = g.Sum(s => s.RBI),
                            SO = g.Sum(s => s.SO),
                            BB = g.Sum(s => s.BB),
                            RE = g.Sum(s => s.RE),
                            HBP = g.Sum(s => s.HBP),
                            INTR = g.Sum(s => s.INTR),
                            SF = g.Sum(s => s.SF),
                            SH = g.Sum(s => s.SH),
                            SB = g.Sum(s => s.SB),
                            CS = g.Sum(s => s.CS),
                            LOB = g.Sum(s => s.LOB),
                            AVG = 0,
                            OBA = 0,
                            OPS = 0,
                            PA = 0,
                            SLG = 0,
                            TB = 0
                        }).SingleOrDefault();
            }
        }


        static public List<GameBatStats> GetBatTeamPlayerSeasonTotals(long teamSeasonId, long seasonId, String sortExpression)
        {
            List<GameBatStats> stats = new List<GameBatStats>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatTeamPlayerSeasonTotals", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
                    myCommand.Parameters.Add("@seasonId", SqlDbType.BigInt).Value = seasonId;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameBatStats(0, dr.GetInt64(0), 0, teamSeasonId, dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17)));
                    }

                    if (sortExpression == String.Empty)
                        sortExpression = "AVG";

                    GameBatStatsComparer statsComparer = new GameBatStatsComparer(sortExpression);
                    stats.Sort(statsComparer);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public IQueryable<GameBatStats> GetBatLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats) //, out int totalRecords)
        {
            DB db = DBConnection.GetContext();

            if (historicalStats)
            {
                var batstats = (from bss in db.batstatsums
                                join rs in db.RosterSeasons on bss.PlayerId equals rs.Id
                                join leagueSchedule in db.LeagueSchedules on bss.GameId equals leagueSchedule.Id
                                join leagueSeason in db.LeagueSeasons on leagueSchedule.LeagueId equals leagueSeason.Id
                                where leagueSchedule.GameStatus == 1 && leagueSeason.LeagueId == leagueId
                                group bss by rs.PlayerId into g
                                let ab = g.Sum(b => b.AB)
                                let h = g.Sum(b => b.H)
                                let bb = g.Sum(b => b.BB)
                                let hbp = g.Sum(b => b.HBP)
                                let d = g.Sum(b => b._2B)
                                let t = g.Sum(b => b._3B)
                                let hr = g.Sum(b => b.HR)
                                let sh = g.Sum(b => b.SH)
                                let sf = g.Sum(b => b.SF)
                                let intr = g.Sum(b => b.INTR)
                                let oba = (ab + bb + hbp) > 0 ? (double)(h + bb + hbp) / (double)(ab + bb + hbp) : 0.00
                                let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                                select new GameCareerBatStats
                                {
                                    PlayerId = g.Key,
                                    AB = ab,
                                    H = h,
                                    R = g.Sum(b => b.R),
                                    D = d,
                                    T = t,
                                    HR = hr,
                                    RBI = g.Sum(b => b.RBI),
                                    SO = g.Sum(b => b.SO),
                                    BB = bb,
                                    RE = g.Sum(b => b.RE),
                                    HBP = hbp,
                                    INTR = intr,
                                    SF = sf,
                                    SH = sh,
                                    SB = g.Sum(b => b.SB),
                                    CS = g.Sum(b => b.CS),
                                    LOB = g.Sum(b => b.LOB),
                                    AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                                    OBA = oba,
                                    OPS = slg + oba,
                                    PA = ab + bb + hbp + sh + sf + intr,
                                    SLG = slg,
                                    TB = tb
                                }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = batstats.Count();

                return batstats;
            }
            else
            {
                var batstats = (from bss in db.batstatsums
                                join ls in db.LeagueSchedules on bss.GameId equals ls.Id
                                where ls.GameStatus == 1 && ls.LeagueId == leagueId
                                group bss by bss.PlayerId into g
                                let ab = g.Sum(b => b.AB)
                                let h = g.Sum(b => b.H)
                                let bb = g.Sum(b => b.BB)
                                let hbp = g.Sum(b => b.HBP)
                                let d = g.Sum(b => b._2B)
                                let t = g.Sum(b => b._3B)
                                let hr = g.Sum(b => b.HR)
                                let sh = g.Sum(b => b.SH)
                                let sf = g.Sum(b => b.SF)
                                let intr = g.Sum(b => b.INTR)
                                let oba = (ab + bb + hbp) > 0 ? (double)(h + bb + hbp) / (double)(ab + bb + hbp) : 0.00
                                let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                                select new GameBatStats
                                {
                                    PlayerId = g.Key,
                                    AB = ab,
                                    H = h,
                                    R = g.Sum(b => b.R),
                                    D = d,
                                    T = t,
                                    HR = hr,
                                    RBI = g.Sum(b => b.RBI),
                                    SO = g.Sum(b => b.SO),
                                    BB = bb,
                                    RE = g.Sum(b => b.RE),
                                    HBP = hbp,
                                    INTR = intr,
                                    SF = sf,
                                    SH = sh,
                                    SB = g.Sum(b => b.SB),
                                    CS = g.Sum(b => b.CS),
                                    LOB = g.Sum(b => b.LOB),
                                    AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                                    OBA = oba,
                                    OPS = slg + oba,
                                    PA = ab + bb + hbp + sh + sf + intr,
                                    SLG = slg,
                                    TB = tb
                                }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = batstats.Count();

                return batstats;
            }
        }

        static public IQueryable<GameBatStats> GetBatLeaguePlayerTotals(long leagueId, long divisionId, string sortField, string sortOrder)
        {
            DB db = DBConnection.GetContext();

            return (from bss in db.batstatsums
                    join ls in db.LeagueSchedules on bss.GameId equals ls.Id
                    join ts in db.TeamsSeasons on bss.TeamId equals ts.Id
                    where ls.GameStatus == 1 && ls.LeagueId == leagueId && ts.DivisionSeasonId == divisionId
                    group bss by bss.PlayerId into g
                    let ab = g.Sum(b => b.AB)
                    let h = g.Sum(b => b.H)
                    let bb = g.Sum(b => b.BB)
                    let hbp = g.Sum(b => b.HBP)
                    let d = g.Sum(b => b._2B)
                    let t = g.Sum(b => b._3B)
                    let hr = g.Sum(b => b.HR)
                    let sh = g.Sum(b => b.SH)
                    let sf = g.Sum(b => b.SF)
                    let intr = g.Sum(b => b.INTR)
                    let oba = (ab + bb + hbp) > 0 ? (double)(h + bb + hbp) / (double)(ab + bb + hbp) : 0.00
                    let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                    let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                    select new GameBatStats
                    {
                        PlayerId = g.Key,
                        AB = ab,
                        H = h,
                        R = g.Sum(b => b.R),
                        D = d,
                        T = t,
                        HR = hr,
                        RBI = g.Sum(b => b.RBI),
                        SO = g.Sum(b => b.SO),
                        BB = bb,
                        RE = g.Sum(b => b.RE),
                        HBP = hbp,
                        INTR = intr,
                        SF = sf,
                        SH = sh,
                        SB = g.Sum(b => b.SB),
                        CS = g.Sum(b => b.CS),
                        LOB = g.Sum(b => b.LOB),
                        AVG = ab > 0 ? (double)h / (double)ab : 0.000,
                        OBA = oba,
                        OPS = slg + oba,
                        PA = ab + bb + hbp + sh + sf + intr,
                        SLG = slg,
                        TB = tb
                    }).OrderBy(sortField + " " + sortOrder);
        }

        static public IQueryable<GamePitchStats> GetPitchTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
        {
            // begin to move to Linq...only for no filter for now.
            DB db = DBConnection.GetContext();

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
            if (historicalStats)
            {
                return (from bss in db.pitchstatsums
                        join rs in db.RosterSeasons on bss.PlayerId equals rs.Id
                        join ts in db.TeamsSeasons on bss.TeamId equals ts.Id
                        where ts.TeamId == teamId
                        group bss by rs.PlayerId into g
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.BB)
                        let hbp = g.Sum(b => b.HBP)
                        let d = g.Sum(b => b._2B)
                        let t = g.Sum(b => b._3B)
                        let hr = g.Sum(b => b.HR)
                        let sc = g.Sum(b => b.SC)
                        let bf = g.Sum(b => b.BF)
                        let ip = g.Sum(b => b.IP)
                        let ip2 = g.Sum(b => b.IP2)
                        let er = g.Sum(b => b.ER)
                        let so = g.Sum(b => b.SO)
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        let ab = bf - bb - hbp - sc
                        let oba = ab > 0 ? (double)h / (double)ab : 0.00
                        let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                        let ipdecimal = (double)ip + (ip2 / 3) + (ip2 % 3) / 10.0
                        let era = (ipdecimal > 0.0) ? (double)er * 9.0 / ipdecimal : 0.0
                        select new GameCareerPitchStats
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            IP = ip,
                            IP2 = ip2,
                            BF = bf,
                            W = g.Sum(b => b.W),
                            L = g.Sum(b => b.L),
                            S = g.Sum(b => b.S),
                            H = h,
                            R = g.Sum(b => b.R),
                            ER = er,
                            D = d,
                            T = t,
                            HR = hr,
                            SO = so,
                            BB = bb,
                            WP = g.Sum(b => b.WP),
                            HBP = hbp,
                            BK = g.Sum(b => b.BK),
                            SC = sc,
                            ERA = era,
                            AB = ab,
                            BB9 = (ipdecimal > 0.0) ? (double)bb / ipdecimal * 9.0 : 0.0,
                            IPDecimal = ipdecimal,
                            WHIP = (ipdecimal > 0.0) ? (double)(h + bb) / ipdecimal : 0.0,
                            TB = tb,
                            K9 = (ipdecimal > 0.0) ? (double)so / ipdecimal * 9.0 : 0.0,
                            OBA = oba,
                            SLG = slg
                        }).OrderBy(sortField + " " + sortOrder);
            }
            else
            {
                return (from bss in db.pitchstatsums
                        where bss.TeamId == teamId
                        group bss by bss.PlayerId into g
                        let h = g.Sum(b => b.H)
                        let bb = g.Sum(b => b.BB)
                        let hbp = g.Sum(b => b.HBP)
                        let d = g.Sum(b => b._2B)
                        let t = g.Sum(b => b._3B)
                        let hr = g.Sum(b => b.HR)
                        let sc = g.Sum(b => b.SC)
                        let bf = g.Sum(b => b.BF)
                        let ip = g.Sum(b => b.IP)
                        let ip2 = g.Sum(b => b.IP2)
                        let er = g.Sum(b => b.ER)
                        let so = g.Sum(b => b.SO)
                        let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                        let ab = bf - bb - hbp - sc
                        let oba = ab > 0 ? (double)h / (double)ab : 0.00
                        let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                        let ipdecimal = (double)ip + (ip2 / 3) + (ip2 % 3) / 10.0
                        let era = (ipdecimal > 0.0) ? (double)er * 9.0 / ipdecimal : 0.0
                        select new GamePitchStats
                        {
                            PlayerId = g.Key,
                            TeamId = teamId,
                            IP = ip,
                            IP2 = ip2,
                            BF = bf,
                            W = g.Sum(b => b.W),
                            L = g.Sum(b => b.L),
                            S = g.Sum(b => b.S),
                            H = h,
                            R = g.Sum(b => b.R),
                            ER = er,
                            D = d,
                            T = t,
                            HR = hr,
                            SO = so,
                            BB = bb,
                            WP = g.Sum(b => b.WP),
                            HBP = hbp,
                            BK = g.Sum(b => b.BK),
                            SC = sc,
                            ERA = era,
                            AB = ab,
                            BB9 = (ipdecimal > 0.0) ? (double)bb / ipdecimal * 9.0 : 0.0,
                            IPDecimal = ipdecimal,
                            WHIP = (ipdecimal > 0.0) ? (double)(h + bb) / ipdecimal : 0.0,
                            TB = tb,
                            K9 = (ipdecimal > 0.0) ? (double)so / ipdecimal * 9.0 : 0.0,
                            OBA = oba,
                            SLG = slg
                        }).OrderBy(sortField + " " + sortOrder);
            }

        }

        static public List<GamePitchStats> GetPitchTeamPlayerSeasonTotals(long teamId, long seasonId, String sortExpression)
        {
            List<GamePitchStats> stats = new List<GamePitchStats>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchTeamPlayerSeasonTotals", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@seasonId", SqlDbType.BigInt).Value = seasonId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GamePitchStats(0, dr.GetInt64(0), 0, teamId, dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17), dr.GetInt32(18)));
                    }

                    if (sortExpression == string.Empty)
                        sortExpression = "ERA DESC";

                    GamePitchStatsComparer statsComparer = new GamePitchStatsComparer(sortExpression);
                    stats.Sort(statsComparer);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GamePitchStats GetPitchTeamSeasonTotals(long teamSeasonId, long seasonId)
        {
            DB db = DBConnection.GetContext();

            var teamId = (from ts in db.TeamsSeasons
                          where ts.Id == teamSeasonId
                          select ts.TeamId).SingleOrDefault();

            if (seasonId == 0)
            {
                return (from bs in db.pitchstatsums
                        join ts in db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in db.Teams on ts.TeamId equals t.Id
                        where t.Id == teamId
                        group bs by t.Id into g
                        select new GamePitchStats() 
                        {
                            TeamId = teamId,
                            W = g.Sum(s => s.W),
                            L = g.Sum(s => s.L),
                            S = g.Sum(s => s.S),
                            H = g.Sum(s => s.H),
                            D = g.Sum(s => s._2B),
                            T = g.Sum(s => s._3B),
                            HR = g.Sum(s => s.HR),
                            SO = g.Sum(s => s.SO),
                            BB = g.Sum(s => s.BB),
                            HBP = g.Sum(s => s.HBP),
                            BF = g.Sum(s => s.BF),
                            BK = g.Sum(s => s.BK),
                            IP = g.Sum(s => s.IP),
                            IP2 = g.Sum(s => s.IP2),
                            R = g.Sum(s => s.R),
                            ER = g.Sum(s => s.ER),
                            SC = g.Sum(s => s.SC),
                            ERA = 0,
                            AB = 0,
                            BB9 = 0,
                            IPDecimal = 0,
                            WHIP = 0,
                            TB = 0,
                            K9 = 0,
                            OBA = 0,
                            SLG = 0
                        }).SingleOrDefault();
            }
            else
            {
                return (from bs in db.pitchstatsums
                        join ts in db.TeamsSeasons on bs.TeamId equals ts.Id
                        join t in db.Teams on ts.TeamId equals t.Id
                        join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where t.Id == teamId && ls.SeasonId == seasonId
                        group bs by new { t.Id, ls.SeasonId } into g
                        select new GamePitchStats()
                        {
                            TeamId = teamId,
                            W = g.Sum(s => s.W),
                            L = g.Sum(s => s.L),
                            S = g.Sum(s => s.S),
                            H = g.Sum(s => s.H),
                            D = g.Sum(s => s._2B),
                            T = g.Sum(s => s._3B),
                            HR = g.Sum(s => s.HR),
                            SO = g.Sum(s => s.SO),
                            BB = g.Sum(s => s.BB),
                            HBP = g.Sum(s => s.HBP),
                            BF = g.Sum(s => s.BF),
                            BK = g.Sum(s => s.BK),
                            IP = g.Sum(s => s.IP),
                            IP2 = g.Sum(s => s.IP2),
                            R = g.Sum(s => s.R),
                            ER = g.Sum(s => s.ER),
                            SC = g.Sum(s => s.SC),
                            ERA = 0,
                            AB = 0,
                            BB9 = 0,
                            IPDecimal = 0,
                            WHIP = 0,
                            TB = 0,
                            K9 = 0,
                            OBA = 0,
                            SLG = 0
                        }).SingleOrDefault();
            }


        }

        static public IQueryable<GamePitchStats> GetPitchLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats)
        {
            DB db = DBConnection.GetContext();

            if (historicalStats)
            {
                var pitchstats = (from pss in db.pitchstatsums
                                  join rs in db.RosterSeasons on pss.PlayerId equals rs.Id
                                  join leagueSchedule in db.LeagueSchedules on pss.GameId equals leagueSchedule.Id
                                  join leagueSeason in db.LeagueSeasons on leagueSchedule.LeagueId equals leagueSeason.Id
                                  where leagueSchedule.GameStatus == 1 && leagueSeason.LeagueId == leagueId
                                  group pss by rs.PlayerId into g
                                  let h = g.Sum(b => b.H)
                                  let bb = g.Sum(b => b.BB)
                                  let hbp = g.Sum(b => b.HBP)
                                  let d = g.Sum(b => b._2B)
                                  let t = g.Sum(b => b._3B)
                                  let hr = g.Sum(b => b.HR)
                                  let sc = g.Sum(b => b.SC)
                                  let bf = g.Sum(b => b.BF)
                                  let ip = g.Sum(b => b.IP)
                                  let ip2 = g.Sum(b => b.IP2)
                                  let er = g.Sum(b => b.ER)
                                  let so = g.Sum(b => b.SO)
                                  let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                  let ab = bf - bb - hbp - sc
                                  let oba = ab > 0 ? (double)h / (double)ab : 0.00
                                  let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                                  let ipdecimal = (double)ip + (ip2 / 3) + (ip2 % 3) / 10.0
                                  let era = (ipdecimal > 0.0) ? (double)er * 9.0 / ipdecimal : 0.0
                                  select new GameCareerPitchStats
                                  {
                                      PlayerId = g.Key,
                                      IP = ip,
                                      IP2 = ip2,
                                      BF = bf,
                                      W = g.Sum(b => b.W),
                                      L = g.Sum(b => b.L),
                                      S = g.Sum(b => b.S),
                                      H = h,
                                      R = g.Sum(b => b.R),
                                      ER = er,
                                      D = d,
                                      T = t,
                                      HR = hr,
                                      SO = so,
                                      BB = bb,
                                      WP = g.Sum(b => b.WP),
                                      HBP = hbp,
                                      BK = g.Sum(b => b.BK),
                                      SC = sc,
                                      ERA = era,
                                      AB = ab,
                                      BB9 = (ipdecimal > 0.0) ? (double)bb / ipdecimal * 9.0 : 0.0,
                                      IPDecimal = ipdecimal,
                                      WHIP = (ipdecimal > 0.0) ? (double)(h + bb) / ipdecimal : 0.0,
                                      TB = tb,
                                      K9 = (ipdecimal > 0.0) ? (double)so / ipdecimal * 9.0 : 0.0,
                                      OBA = oba,
                                      SLG = slg
                                  }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = pitchstats.Count();

                return pitchstats;
            }
            else
            {
                var pitchstats = (from pss in db.pitchstatsums
                                  join ls in db.LeagueSchedules on pss.GameId equals ls.Id
                                  where ls.GameStatus == 1 && ls.LeagueId == leagueId
                                  group pss by pss.PlayerId into g
                                  let h = g.Sum(b => b.H)
                                  let bb = g.Sum(b => b.BB)
                                  let hbp = g.Sum(b => b.HBP)
                                  let d = g.Sum(b => b._2B)
                                  let t = g.Sum(b => b._3B)
                                  let hr = g.Sum(b => b.HR)
                                  let sc = g.Sum(b => b.SC)
                                  let bf = g.Sum(b => b.BF)
                                  let ip = g.Sum(b => b.IP)
                                  let ip2 = g.Sum(b => b.IP2)
                                  let er = g.Sum(b => b.ER)
                                  let so = g.Sum(b => b.SO)
                                  let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                                  let ab = bf - bb - hbp - sc
                                  let oba = ab > 0 ? (double)h / (double)ab : 0.00
                                  let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                                  let ipdecimal = (double)ip + (ip2 / 3) + (ip2 % 3) / 10.0
                                  let era = (ipdecimal > 0.0) ? (double)er * 9.0 / ipdecimal : 0.0
                                  select new GamePitchStats
                                  {
                                      PlayerId = g.Key,
                                      IP = ip,
                                      IP2 = ip2,
                                      BF = bf,
                                      W = g.Sum(b => b.W),
                                      L = g.Sum(b => b.L),
                                      S = g.Sum(b => b.S),
                                      H = h,
                                      R = g.Sum(b => b.R),
                                      ER = er,
                                      D = d,
                                      T = t,
                                      HR = hr,
                                      SO = so,
                                      BB = bb,
                                      WP = g.Sum(b => b.WP),
                                      HBP = hbp,
                                      BK = g.Sum(b => b.BK),
                                      SC = sc,
                                      ERA = era,
                                      AB = ab,
                                      BB9 = (ipdecimal > 0.0) ? (double)bb / ipdecimal * 9.0 : 0.0,
                                      IPDecimal = ipdecimal,
                                      WHIP = (ipdecimal > 0.0) ? (double)(h + bb) / ipdecimal : 0.0,
                                      TB = tb,
                                      K9 = (ipdecimal > 0.0) ? (double)so / ipdecimal * 9.0 : 0.0,
                                      OBA = oba,
                                      SLG = slg
                                  }).OrderBy(sortField + " " + sortOrder);

                //totalRecords = pitchstats.Count();

                return pitchstats;
            }
        }

        static public IQueryable<GamePitchStats> GetPitchLeaguePlayerTotals(long leagueId, long divisionId, string sortField, string sortOrder)
        {
            DB db = DBConnection.GetContext();

            return (from pss in db.pitchstatsums
                    join ls in db.LeagueSchedules on pss.GameId equals ls.Id
                    join ts in db.TeamsSeasons on pss.TeamId equals ts.Id 
                    where ls.GameStatus == 1 && ls.LeagueId == leagueId && ts.DivisionSeasonId == divisionId
                    group pss by pss.PlayerId into g
                    let h = g.Sum(b => b.H)
                    let bb = g.Sum(b => b.BB)
                    let hbp = g.Sum(b => b.HBP)
                    let d = g.Sum(b => b._2B)
                    let t = g.Sum(b => b._3B)
                    let hr = g.Sum(b => b.HR)
                    let sc = g.Sum(b => b.SC)
                    let bf = g.Sum(b => b.BF)
                    let ip = g.Sum(b => b.IP)
                    let ip2 = g.Sum(b => b.IP2)
                    let er = g.Sum(b => b.ER)
                    let so = g.Sum(b => b.SO)
                    let tb = (d * 2) + (t * 3) + (hr * 4) + (h - d - t - hr)
                    let ab = bf - bb - hbp - sc
                    let oba = ab > 0 ? (double)h / (double)ab : 0.00
                    let slg = ab > 0 ? (double)tb / (double)ab : 0.000
                    let ipdecimal = (double)ip + (ip2 / 3) + (ip2 % 3) / 10.0
                    let era = (ipdecimal > 0.0) ? (double)er * 9.0 / ipdecimal : 0.0
                    select new GamePitchStats
                    {
                        PlayerId = g.Key,
                        IP = ip,
                        IP2 = ip2,
                        BF = bf,
                        W = g.Sum(b => b.W),
                        L = g.Sum(b => b.L),
                        S = g.Sum(b => b.S),
                        H = h,
                        R = g.Sum(b => b.R),
                        ER = er,
                        D = d,
                        T = t,
                        HR = hr,
                        SO = so,
                        BB = bb,
                        WP = g.Sum(b => b.WP),
                        HBP = hbp,
                        BK = g.Sum(b => b.BK),
                        SC = sc,
                        ERA = era,
                        AB = ab,
                        BB9 = (ipdecimal > 0.0) ? (double)bb / ipdecimal * 9.0 : 0.0,
                        IPDecimal = ipdecimal,
                        WHIP = (ipdecimal > 0.0) ? (double)(h + bb) / ipdecimal : 0.0,
                        TB = tb,
                        K9 = (ipdecimal > 0.0) ? (double)so / ipdecimal * 9.0 : 0.0,
                        OBA = oba,
                        SLG = slg
                    }).OrderBy(sortField + " " + sortOrder);
        }

        static public GameFieldStats[] GetFieldTeamPlayerTotals(long teamId, int filter, long filterData)
        {
            ArrayList stats = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;
                    switch (filter)
                    {
                        case 2: // vs. team
                            myCommand = new SqlCommand("dbo.GetFieldTeamPlayerTotalsVsTeam", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsTeamId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 3: // vs. division
                            myCommand = new SqlCommand("dbo.GetFieldTeamPlayerTotalsVsDivision", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@vsDivisionId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 4: // single game
                            myCommand = new SqlCommand("dbo.GetFieldTeamPlayerTotalsByGame", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = filterData;
                            break;
                        case 1:
                        default:
                            myCommand = new SqlCommand("dbo.GetFieldTeamPlayerTotals", myConnection);
                            myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                            break;
                    }

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameFieldStats(0, dr.GetInt64(0), 0, teamId, dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (GameFieldStats[])stats.ToArray(typeof(GameFieldStats));
        }

        static public GameBatStats GetBatGameTotals(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from bs in db.batstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    group bs by new { bs.GameId, bs.TeamId } into g
                    select new GameBatStats()
                    {
                        GameId = gameId,
                        TeamId = teamId,
                        AB = g.Sum(s => s.AB),
                        H = g.Sum(s => s.H),
                        R = g.Sum(s => s.R),
                        D = g.Sum(s => s._2B),
                        T = g.Sum(s => s._3B),
                        HR = g.Sum(s => s.HR),
                        RBI = g.Sum(s => s.RBI),
                        SO = g.Sum(s => s.SO),
                        BB = g.Sum(s => s.BB),
                        RE = g.Sum(s => s.RE),
                        HBP = g.Sum(s => s.HBP),
                        INTR = g.Sum(s => s.INTR),
                        SF = g.Sum(s => s.SF),
                        SH = g.Sum(s => s.SH),
                        SB = g.Sum(s => s.SB),
                        CS = g.Sum(s => s.CS),
                        LOB = g.Sum(s => s.LOB),
                        AVG = 0,
                        OBA = 0,
                        OPS = 0,
                        PA = 0,
                        SLG = 0,
                        TB = 0
                    }).SingleOrDefault();

        }

        static public GamePitchStats GetPitchGameTotals(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from bs in db.pitchstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    group bs by new { bs.GameId, bs.TeamId } into g
                    select new GamePitchStats()
                    {
                        GameId = gameId,
                        TeamId = teamId,
                        W = g.Sum(s => s.W),
                        L = g.Sum(s => s.L),
                        S = g.Sum(s => s.S),
                        H = g.Sum(s => s.H),
                        D = g.Sum(s => s._2B),
                        T = g.Sum(s => s._3B),
                        HR = g.Sum(s => s.HR),
                        SO = g.Sum(s => s.SO),
                        BB = g.Sum(s => s.BB),
                        HBP = g.Sum(s => s.HBP),
                        BF = g.Sum(s => s.BF),
                        BK = g.Sum(s => s.BK),
                        IP = g.Sum(s => s.IP),
                        IP2 = g.Sum(s => s.IP2),
                        R = g.Sum(s => s.R),
                        ER = g.Sum(s => s.ER),
                        SC = g.Sum(s => s.SC),
                        ERA = 0,
                        AB = 0,
                        BB9 = 0,
                        IPDecimal = 0,
                        WHIP = 0,
                        TB = 0,
                        K9 = 0,
                        OBA = 0,
                        SLG = 0
                    }).SingleOrDefault();

        }

        static public GameFieldStats GetFieldGameTotals(long gameId, long teamId)
        {
            GameFieldStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetFieldGameTotals", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameFieldStats(0, 0, gameId, teamId, 0, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public IQueryable<GameBatStats> GetBatGameStats(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from bs in db.batstatsums
                    where bs.GameId == gameId && bs.TeamId == teamId
                    select new GameBatStats(bs.Id, bs.PlayerId, bs.GameId, bs.TeamId, bs.AB, bs.H, bs.R, bs._2B, bs._3B, bs.HR, bs.RBI, bs.SO, bs.BB,
                        bs.RE, bs.HBP, bs.INTR, bs.SF, bs.SH, bs.SB, bs.CS, bs.LOB));
        }

        static public IQueryable<GamePitchStats> GetPitchGameStats(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from ps in db.pitchstatsums
                    where ps.GameId == gameId && ps.TeamId == teamId
                    select new GamePitchStats(ps.Id, ps.PlayerId, ps.GameId, ps.TeamId, ps.IP, ps.IP2, ps.BF, ps.W, ps.L, ps.S, ps.H, ps.R, ps.ER, ps._2B, ps._3B,
                        ps.HR, ps.SO, ps.BB, ps.WP, ps.HBP, ps.BK, ps.SC));
        }

        static public IQueryable<GameFieldStats> GetFieldGameStats(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from ps in db.fieldstatsums
                    where ps.GameId == gameId && ps.TeamId == teamId
                    select new GameFieldStats(ps.Id, ps.PlayerId, ps.GameId, ps.TeamId, ps.POS, ps.IP, ps.IP2, ps.PO, ps.A, ps.E, ps.PB, ps.SB, ps.CS));
        }

        static public bool UpdateBattingGameStats(GameBatStats g)
        {
            DB db = DBConnection.GetContext();

            if (!g.IsValid())
                return false;

            var dbStats = (from bs in db.batstatsums
                           where bs.Id == g.Id
                           select bs).SingleOrDefault();
            if (dbStats == null)
                return false;

            dbStats.AB = g.AB;
            dbStats.H = g.H;
            dbStats.R = g.R;
            dbStats._2B = g.D;
            dbStats._3B = g.T;
            dbStats.HR = g.HR;
            dbStats.RBI = g.RBI;
            dbStats.SO = g.SO;
            dbStats.BB = g.BB;
            dbStats.SB = g.SB;
            dbStats.CS = g.CS;
            dbStats.RE = g.RE;
            dbStats.HBP = g.HBP;
            dbStats.INTR = g.INTR;
            dbStats.SF = g.SF;
            dbStats.SH = g.SH;
            dbStats.LOB = g.LOB;

            db.SubmitChanges();
            return true;
        }

        static public long AddBattingGameStats(GameBatStats g)
        {
            if (!g.IsValid())
                return 0;

            DB db = DBConnection.GetContext();
            var dbStats = (from bs in db.batstatsums
                           where bs.PlayerId == g.PlayerId && bs.GameId == g.GameId && bs.TeamId == g.TeamId
                           select bs).SingleOrDefault();

            // stat already exists, can't add it.
            if (dbStats != null)
                return 0;

            dbStats = new SportsManager.Model.batstatsum()
            {
                PlayerId = g.PlayerId,
                GameId = g.GameId,
                TeamId = g.TeamId
            };

            db.batstatsums.InsertOnSubmit(dbStats);
            db.SubmitChanges();

            return dbStats.Id;
        }

        static public bool UpdatePitchingGameStats(GamePitchStats g)
        {
            DB db = DBConnection.GetContext();

            if (!g.IsValid())
                return false;

            var dbStats = (from bs in db.pitchstatsums
                           where bs.Id == g.Id
                           select bs).SingleOrDefault();
            if (dbStats == null)
                return false;

            dbStats.IP = g.IP;
            dbStats.IP2 = g.IP2;
            dbStats.BF = g.BF;
            dbStats.W = g.W;
            dbStats.L = g.L;
            dbStats.S = g.S;
            dbStats.H = g.H;
            dbStats.R = g.R;
            dbStats.ER = g.ER;
            dbStats._2B = g.D;
            dbStats._3B = g.T;
            dbStats.HR = g.HR;
            dbStats.SO = g.SO;
            dbStats.BB = g.BB;
            dbStats.WP = g.WP;
            dbStats.HBP = g.HBP;
            dbStats.BK = g.BK;
            dbStats.SC = g.SC;

            db.SubmitChanges();
            return true;
        }

        static public long AddPitchingGameStats(GamePitchStats g)
        {
            if (!g.IsValid())
                return 0;

            DB db = DBConnection.GetContext();
            var dbStats = (from bs in db.pitchstatsums
                           where bs.PlayerId == g.PlayerId && bs.GameId == g.GameId && bs.TeamId == g.TeamId
                           select bs).SingleOrDefault();

            // stat already exists, can't add it.
            if (dbStats != null)
                return 0;

            dbStats = new SportsManager.Model.pitchstatsum()
            {
                PlayerId = g.PlayerId,
                GameId = g.GameId,
                TeamId = g.TeamId
            };

            db.pitchstatsums.InsertOnSubmit(dbStats);
            db.SubmitChanges();

            return dbStats.Id;
        }

        static public int UpdateFieldingGameStats(GameFieldStats g)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateFieldingGameStats", myConnection);
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = g.Id;
                    myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = g.POS;
                    myCommand.Parameters.Add("@ip", SqlDbType.Int).Value = g.IP;
                    myCommand.Parameters.Add("@ip2", SqlDbType.Int).Value = g.IP2;
                    myCommand.Parameters.Add("@po", SqlDbType.Int).Value = g.PO;
                    myCommand.Parameters.Add("@a", SqlDbType.Int).Value = g.A;
                    myCommand.Parameters.Add("@e", SqlDbType.Int).Value = g.E;
                    myCommand.Parameters.Add("@pb", SqlDbType.Int).Value = g.PB;
                    myCommand.Parameters.Add("@sb", SqlDbType.Int).Value = g.SB;
                    myCommand.Parameters.Add("@cs", SqlDbType.Int).Value = g.CS;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rc);
        }

        static public int AddFieldingGameStats(GameFieldStats g)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.InsertFieldingGameStats", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = g.GameId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = g.TeamId;
                    myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = g.PlayerId;
                    myCommand.Parameters.Add("@pos", SqlDbType.Int).Value = g.POS;
                    myCommand.Parameters.Add("@ip", SqlDbType.Int).Value = g.IP;
                    myCommand.Parameters.Add("@ip2", SqlDbType.Int).Value = g.IP2;
                    myCommand.Parameters.Add("@po", SqlDbType.Int).Value = g.PO;
                    myCommand.Parameters.Add("@a", SqlDbType.Int).Value = g.A;
                    myCommand.Parameters.Add("@e", SqlDbType.Int).Value = g.E;
                    myCommand.Parameters.Add("@pb", SqlDbType.Int).Value = g.PB;
                    myCommand.Parameters.Add("@sb", SqlDbType.Int).Value = g.SB;
                    myCommand.Parameters.Add("@cs", SqlDbType.Int).Value = g.CS;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rc);
        }

        static public bool RemoveGameBatStats(GameBatStats g)
        {
            DB db = DBConnection.GetContext();
            var dbStat = (from bs in db.batstatsums
                          where bs.GameId == g.GameId &&
                           bs.TeamId == g.TeamId &&
                          bs.PlayerId == g.PlayerId
                          select bs).SingleOrDefault();
            if (dbStat == null)
                return false;

            db.batstatsums.DeleteOnSubmit(dbStat);
            db.SubmitChanges();

            return true;
        }

        static public bool RemoveGamePitchStats(GamePitchStats g)
        {
            DB db = DBConnection.GetContext();
            var dbStat = (from bs in db.pitchstatsums
                          where bs.GameId == g.GameId &&
                           bs.TeamId == g.TeamId &&
                          bs.PlayerId == g.PlayerId
                          select bs).SingleOrDefault();
            if (dbStat == null)
                return false;

            db.pitchstatsums.DeleteOnSubmit(dbStat);
            db.SubmitChanges();

            return true;
        }

        static public bool RemoveGameFieldStats(GameFieldStats g)
        {
            DB db = DBConnection.GetContext();
            var dbStat = (from bs in db.fieldstatsums
                          where bs.GameId == g.GameId &&
                           bs.TeamId == g.TeamId &&
                          bs.PlayerId == g.PlayerId
                          select bs).SingleOrDefault();
            if (dbStat == null)
                return false;

            db.fieldstatsums.DeleteOnSubmit(dbStat);
            db.SubmitChanges();

            return true;
        }

        static public bool RemovePlayerStats(long id)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeletePlayerStats", myConnection);
                    myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = id;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount > 0);
        }

        static public bool ValidateStats(long gameId)
        {
            bool validated = false;

            Game g = Schedule.GetGame(gameId);

            long homeTeamId = g.HomeTeamId;
            long awayTeamId = g.AwayTeamId;

            GameBatStats homeBatStats = GetBatGameTotals(gameId, homeTeamId);
            GameBatStats awayBatStats = GetBatGameTotals(gameId, awayTeamId);

            GamePitchStats homePitchStats = GetPitchGameTotals(gameId, homeTeamId);
            GamePitchStats awayPitchStats = GetPitchGameTotals(gameId, awayTeamId);

            GameFieldStats homeFieldStats = GetFieldGameTotals(gameId, homeTeamId);
            GameFieldStats awayFieldStats = GetFieldGameTotals(gameId, awayTeamId);

            int homePlateApp = homeBatStats.AB + homeBatStats.BB + homeBatStats.HBP + homeBatStats.INTR + homeBatStats.SF + homeBatStats.SH;
            int awayPlateApp = awayBatStats.AB + awayBatStats.BB + awayBatStats.HBP + awayBatStats.INTR + awayBatStats.SF + awayBatStats.SH;

            int homeWin = 0;
            int homeLoss = 0;
            int homeSave = 0;

            int awayWin = 0;
            int awayLoss = 0;
            int awaySave = 0;

            int homeIP = homePitchStats.IP + (homePitchStats.IP2 / 3);
            int homeIP2 = homePitchStats.IP2 % 3;
            int homePO = homeIP * 3 + homeIP2;

            int awayIP = awayPitchStats.IP + (awayPitchStats.IP2 / 3);
            int awayIP2 = awayPitchStats.IP2 % 3;
            int awayPO = awayIP * 3 + awayIP2;

            if (g.HomeScore > g.AwayScore)
            {
                homeWin = 1;
                homeSave = 1;
                awayLoss = 1;
            }
            else if (g.HomeScore < g.AwayScore)
            {
                awayWin = 1;
                awaySave = 1;
                homeLoss = 1;
            }

            if (homePO == homeFieldStats.PO &&
                 homePitchStats.W == homeWin &&
                 homePitchStats.L == homeLoss &&
                 homePitchStats.S <= homeSave &&
                 homeBatStats.R == g.HomeScore &&
                 homeBatStats.SH + homeBatStats.SF == awayPitchStats.SC &&
                 homePlateApp == awayPitchStats.BF &&
                 homeBatStats.R == awayPitchStats.R &&
                 homeBatStats.H == awayPitchStats.H &&
                 homeBatStats.D == awayPitchStats.D &&
                 homeBatStats.T == awayPitchStats.T &&
                 homeBatStats.HR == awayPitchStats.HR &&
                 homeBatStats.SO == awayPitchStats.SO &&
                 homeBatStats.BB == awayPitchStats.BB &&
                 homeBatStats.HBP == awayPitchStats.HBP)
            {
                if (awayPO == awayFieldStats.PO &&
                     awayPitchStats.W == awayWin &&
                     awayPitchStats.L == awayLoss &&
                     awayPitchStats.S <= awaySave &&
                     awayBatStats.SH + awayBatStats.SF == homePitchStats.SC &&
                     awayBatStats.R == g.AwayScore &&
                     awayPlateApp == homePitchStats.BF &&
                     awayBatStats.R == homePitchStats.R &&
                     awayBatStats.H == homePitchStats.H &&
                     awayBatStats.D == homePitchStats.D &&
                     awayBatStats.T == homePitchStats.T &&
                     awayBatStats.HR == homePitchStats.HR &&
                     awayBatStats.SO == homePitchStats.SO &&
                     awayBatStats.BB == homePitchStats.BB &&
                     awayBatStats.HBP == homePitchStats.HBP)
                {
                    // prove the boxscore.
                    // prove home team
                    if (homeBatStats.AB + homeBatStats.BB + homeBatStats.HBP + homeBatStats.SH + homeBatStats.SF + homeBatStats.INTR ==
                         homeBatStats.R + homeBatStats.LOB + awayFieldStats.PO)
                    {
                        // prove away team
                        if (awayBatStats.AB + awayBatStats.BB + awayBatStats.HBP + awayBatStats.SH + awayBatStats.SF + awayBatStats.INTR ==
                             awayBatStats.R + awayBatStats.LOB + homeFieldStats.PO)
                        {
                            validated = true;
                        }
                    }
                }
            }

            return validated;
        }

        static public bool HasGameRecap(long gameId)
        {
            bool hasRecap = false;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.HasGameRecap", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read() && dr.GetInt32(0) > 0)
                    {
                        hasRecap = true;
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                hasRecap = false;
            }

            return hasRecap;
        }

        static public GameRecap GetGameRecap(long gameId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from gr in db.GameRecaps
                    where gr.TeamId == teamId && gr.GameId == gameId
                    select new GameRecap()
                    {
                        GameId = gr.GameId,
                        Recap = gr.Recap,
                        TeamId = gr.TeamId
                    }).SingleOrDefault();
        }

        static public bool UpdateGameRecap(GameRecap recap)
        {
            DB db = DBConnection.GetContext();
            
            bool update = true;

            var dbGameRecap = (from gr in db.GameRecaps
                               where gr.GameId == recap.GameId && gr.TeamId == recap.TeamId
                               select gr).SingleOrDefault();
            if (dbGameRecap == null)
            {
                update = false;    
                dbGameRecap = new SportsManager.Model.GameRecap();
            }

            dbGameRecap.GameId = recap.GameId;
            dbGameRecap.TeamId = recap.TeamId;
            dbGameRecap.Recap = recap.Recap ?? String.Empty;

            if (!update)
                db.GameRecaps.InsertOnSubmit(dbGameRecap);

            db.SubmitChanges();

            return true;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="playerId"></param>
        /// <param name="fromSeason">playerId is either a contactId or rosterSeasonId</param>
        /// <returns></returns>
        static public IQueryable<GameCareerBatStats> GetBatPlayerCareer(long playerId, bool fromSeason)
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

            DB db = DBConnection.GetContext();

            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in db.RosterSeasons
                                   join r in db.Rosters on rs.PlayerId equals r.Id
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
            long rosterPlayerId = (from r in db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            return (from rs in db.RosterSeasons
                    join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join t in db.Teams on ts.TeamId equals t.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join s in db.Seasons on ls.SeasonId equals s.Id
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    join bss in db.batstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId && bss.Id != null
                    orderby s.Name, l.Name, ts.Name
                    group new { bss, s, l, ts } by new { bss.PlayerId, seasonName = s.Name, leagueName = l.Name, teamName = ts.Name } into g
                    select new GameCareerBatStats(g.Key.PlayerId,
                        g.Key.seasonName,
                        g.Key.teamName,
                        g.Key.leagueName,
                        g.Sum(b => b.bss.AB),
                        g.Sum(b => b.bss.H),
                        g.Sum(b => b.bss.R),
                        g.Sum(b => b.bss._2B),
                        g.Sum(b => b.bss._3B),
                        g.Sum(b => b.bss.HR),
                        g.Sum(b => b.bss.RBI),
                        g.Sum(b => b.bss.SO),
                        g.Sum(b => b.bss.BB),
                        g.Sum(b => b.bss.HBP),
                        g.Sum(b => b.bss.INTR),
                        g.Sum(b => b.bss.SF),
                        g.Sum(b => b.bss.SH),
                        g.Sum(b => b.bss.SB)));
        }

        static public GameCareerBatStats GetBatPlayerCareerTotal(long playerId, bool fromSeason)
        {
            DB db = DBConnection.GetContext();

            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in db.RosterSeasons
                                   join r in db.Rosters on rs.PlayerId equals r.Id
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
            long rosterPlayerId = (from r in db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            //SELECT SUM(AB) as AB, SUM(H) as H, SUM(R) as R, SUM([2B]) as [2B], SUM([3B]) as [3B], SUM(HR) as HR, SUM(RBI) as RBI, SUM(SO) as SO, SUM(BB) as BB, SUM(HBP) as HBP, SUM(INTR) as INTR, SUM(SF) as SF, SUM(SH) as SH, SUM(SB) as SB, @playerId 
            //FROM RosterSeason LEFT JOIN batstatsum ON RosterSeason.Id = batstatsum.PlayerId 
            //WHERE RosterSeason.PlayerId = @playerId

            return (from rs in db.RosterSeasons
                    join bss in db.batstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId
                    group new { rs, bss } by rs.PlayerId into g
                    select new GameCareerBatStats(g.Key,
                    "",
                    "",
                    "",
                    g.Sum(b => b.bss.AB),
                    g.Sum(b => b.bss.H),
                    g.Sum(b => b.bss.R),
                    g.Sum(b => b.bss._2B),
                    g.Sum(b => b.bss._3B),
                    g.Sum(b => b.bss.HR),
                    g.Sum(b => b.bss.RBI),
                    g.Sum(b => b.bss.SO),
                    g.Sum(b => b.bss.BB),
                    g.Sum(b => b.bss.HBP),
                    g.Sum(b => b.bss.INTR),
                    g.Sum(b => b.bss.SF),
                    g.Sum(b => b.bss.SH),
                    g.Sum(b => b.bss.SB))).SingleOrDefault();
        }

        static public IQueryable<GameCareerPitchStats> GetPitchPlayerCareer(long playerId, bool fromSeason)
        {
            DB db = DBConnection.GetContext();

            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in db.RosterSeasons
                                   join r in db.Rosters on rs.PlayerId equals r.Id
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
            long rosterPlayerId = (from r in db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            return (from rs in db.RosterSeasons
                    join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join t in db.Teams on ts.TeamId equals t.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    join s in db.Seasons on ls.SeasonId equals s.Id
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    join bss in db.pitchstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId && bss.Id != null
                    orderby s.Name, l.Name, ts.Name
                    group new { bss, s, l, ts } by new { bss.PlayerId, seasonName = s.Name, leagueName = l.Name, teamName = ts.Name } into g
                    select new GameCareerPitchStats(g.Key.PlayerId,
                        g.Key.seasonName,
                        g.Key.teamName,
                        g.Key.leagueName,
                        g.Sum(b => b.bss.IP),
                        g.Sum(b => b.bss.IP2),
                        g.Sum(b => b.bss.BF),
                        g.Sum(b => b.bss.W),
                        g.Sum(b => b.bss.L),
                        g.Sum(b => b.bss.S),
                        g.Sum(b => b.bss.H),
                        g.Sum(b => b.bss.R),
                        g.Sum(b => b.bss.ER),
                        g.Sum(b => b.bss._2B),
                        g.Sum(b => b.bss._3B),
                        g.Sum(b => b.bss.HR),
                        g.Sum(b => b.bss.SO),
                        g.Sum(b => b.bss.BB),
                        g.Sum(b => b.bss.WP),
                        g.Sum(b => b.bss.HBP),
                        g.Sum(b => b.bss.BK),
                        g.Sum(b => b.bss.SC)));

        }

        static public GameCareerPitchStats GetPitchPlayerCareerTotal(long playerId, bool fromSeason)
        {
            DB db = DBConnection.GetContext();

            long playerContactId = 0;
            if (fromSeason)
            {
                playerContactId = (from rs in db.RosterSeasons
                                   join r in db.Rosters on rs.PlayerId equals r.Id
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
            long rosterPlayerId = (from r in db.Rosters
                                   where r.ContactId == playerContactId
                                   select r.Id).SingleOrDefault();

            if (rosterPlayerId == 0)
                return null;

            return (from rs in db.RosterSeasons
                    join bss in db.pitchstatsums on rs.Id equals bss.PlayerId
                    where rs.PlayerId == rosterPlayerId
                    group new { rs, bss } by rs.PlayerId into g
                    select new GameCareerPitchStats(g.Key,
                    "",
                    "",
                    "",
                    g.Sum(b => b.bss.IP),
                    g.Sum(b => b.bss.IP2),
                    g.Sum(b => b.bss.BF),
                    g.Sum(b => b.bss.W),
                    g.Sum(b => b.bss.L),
                    g.Sum(b => b.bss.S),
                    g.Sum(b => b.bss.H),
                    g.Sum(b => b.bss.R),
                    g.Sum(b => b.bss.ER),
                    g.Sum(b => b.bss._2B),
                    g.Sum(b => b.bss._3B),
                    g.Sum(b => b.bss.HR),
                    g.Sum(b => b.bss.SO),
                    g.Sum(b => b.bss.BB),
                    g.Sum(b => b.bss.WP),
                    g.Sum(b => b.bss.HBP),
                    g.Sum(b => b.bss.BK),
                    g.Sum(b => b.bss.SC))).SingleOrDefault();
        }

        static public int CalculateMinAB(long leagueId)
        {
            // 1.5 min ab's per game
            return CalculateMin(leagueId, 1.5f);
        }

        static public int CalculateMinIP(long leagueId)
        {
            // 1.0 innings pitched per game.
            return CalculateMin(leagueId, 1.0f);
        }

        static private int CalculateMin(long leagueId, float minNum)
        {
            DB db = DBConnection.GetContext();

            double curMin = 0.0f;

            var totalGames = (from ls in db.LeagueSchedules
                              where ls.LeagueId == leagueId && ls.GameType == 0 && (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                              select ls).Count();

            var numGames = totalGames * 2;

            var numTeams = (from ts in db.TeamsSeasons
                            where ts.LeagueSeasonId == leagueId
                            select ts).Count();

            if (numTeams > 0)
                curMin = (double)numGames / (double)numTeams * (double)minNum;

            if (curMin < 0.0)
                curMin = 0.0;

            return (int)curMin;
        }

        static public int CalculateTeamMinAB(long teamSeasonId)
        {
            // 1.5 min ab's per game
            return CalculateTeamMin(teamSeasonId, 1.5f);
        }

        static public int CalculateTeamMinIP(long teamSeasonId)
        {
            // 1.0 innings pitched per game.
            return CalculateTeamMin(teamSeasonId, 1.0f);
        }

        static private int CalculateTeamMin(long teamSeasonId, float minNum)
        {
            DB db = DBConnection.GetContext();

            double curMin = 0.0f;

            var numGames = (from ls in db.LeagueSchedules
                              where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) && ls.GameType == 0 && (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                              select ls).Count();

            curMin = (double)numGames * (double)minNum;

            if (curMin < 0.0)
                curMin = 0.0;

            return (int)curMin;
        }

        // holds results from Leader queries.
        class LeaderStatRecord
        {
            public long PlayerId = 0;
            public long TeamId = 0;
            public Decimal? FieldTotal = Decimal.MinValue;
            public Decimal? CheckField = Decimal.MinValue;
        };

        static public List<LeagueLeaderStat> GetBatTeamLeaders(long teamSeasonId, string fieldName, int limitRecords, int minAB)
        {
            DB db = DBConnection.GetContext();
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            bool abCheck = NeedABCheck(fieldName);

            IEnumerable result = new List<LeagueLeaderStat>();

            String queryString = GetBatTeamLeadersQueryString(teamSeasonId, fieldName);

            result = db.ExecuteQuery(typeof(LeaderStatRecord), queryString, new object[] { });
            return ProcessLeaders(result, fieldName, false, limitRecords, abCheck, minAB);
        }

        static private String GetBatTeamLeadersQueryString(long teamSeasonId, String fieldName)
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

        static public List<LeagueLeaderStat> GetPitchTeamLeaders(long teamSeasonId, string fieldName, int limitRecords, int minIP)
        {
            DB db = DBConnection.GetContext();
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            bool ipCheck = NeedIPCheck(fieldName);

            IEnumerable result = new List<LeagueLeaderStat>();

            String queryString = GetPitchTeamLeadersQueryString(teamSeasonId, fieldName);

            result = db.ExecuteQuery(typeof(LeaderStatRecord), queryString, new object[] { });
            return ProcessLeaders(result, fieldName, false, limitRecords, ipCheck, minIP);
        }

        static private String GetPitchTeamLeadersQueryString(long teamSeasonId, String fieldName)
        {
            DB db = DBConnection.GetContext();

            String query;

            query = @"SELECT pitchstatsum.PlayerId, {1}
                          FROM pitchstatsum LEFT JOIN LeagueSchedule ON pitchstatsum.GameId = LeagueSchedule.Id
                          WHERE GameStatus = 1 AND (HTeamId = {0} OR VTeamId = {0}) AND TeamId = {0}
                          GROUP BY pitchstatsum.PlayerId ORDER BY FieldTotal {2}";

            String orderBy = "DESC";
            String selectStmt = BuildSelectForPitchLeaders(fieldName, out orderBy);

            return String.Format(query, teamSeasonId, selectStmt, orderBy);

        }

        static private List<LeagueLeaderStat> ProcessLeaders(IEnumerable batStats, string fieldName, bool allTimeLeaders, int limitRecords, bool checkMin, int minVal)
        {
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            Dictionary<double, List<LeagueLeaderStat>> leaderList = new Dictionary<double, List<LeagueLeaderStat>>();
            List<double> leaderKeys = new List<double>();

            int numRecords = 0;

            foreach(LeaderStatRecord batStat in batStats)
            {
                if (batStat.FieldTotal.HasValue && (!checkMin || (checkMin && ((int)batStat.CheckField) >= minVal)))
                {
                    double totalValue = (double)batStat.FieldTotal;
                    LeagueLeaderStat stat = new LeagueLeaderStat(fieldName, batStat.PlayerId, allTimeLeaders ? 0 : batStat.TeamId, totalValue);
                    if (leaderList.ContainsKey(totalValue))
                    {
                        leaderList[totalValue].Add(stat);
                    }
                    else
                    {
                        // if we need to add a new record, it means we are done with potential ties.
                        if (numRecords >= limitRecords)
                            break;

                        leaderKeys.Add(totalValue);

                        List<LeagueLeaderStat> leaderStats = new List<LeagueLeaderStat>();
                        leaderStats.Add(stat);
                        leaderList[totalValue] = leaderStats;
                    }

                    numRecords++;
                }
            }

            foreach (double leaderKey in leaderKeys)
            {
                List<LeagueLeaderStat> leaderStats = leaderList[leaderKey];
                bool addedLeaderTie = false;

                // a tie for overall leader.
                //if (stats.Count == 0 && leaderStats.Count > 1)
                //{
                //    // add tie indicator for overall leader
                //    stats.Add(new LeagueLeaderStat(leaderStats.Count, leaderKey));
                //    addedLeaderTie = true;
                //}

                // if we can display all the leaders, display them, otherwise done.
                if (leaderStats.Count + stats.Count <= limitRecords)
                {
                    foreach (LeagueLeaderStat leaderStat in leaderStats)
                    {
                        stats.Add(leaderStat);
                    }
                }
                else
                {
                    if (!addedLeaderTie)
                        stats.Add(new LeagueLeaderStat(leaderStats.Count, leaderKey));

                    // done processing.
                    break;
                }

                if (stats.Count >= limitRecords)
                    break;
            }

            // add in name for player, team, and player photo.
            foreach (var stat in stats)
            {
                if (stat.PlayerId > 0)
                    stat.PlayerName = DataAccess.TeamRoster.GetPlayerName(stat.PlayerId, allTimeLeaders);

                if (stat.TeamId > 0)
                    stat.TeamName = DataAccess.Teams.GetTeamName(stat.TeamId);

            }

            return stats;
        }

        static public List<LeagueLeaderStat> GetBatLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minAB, bool allTimeLeaders)
        {
            DB db = DBConnection.GetContext();
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            bool abCheck = NeedABCheck(fieldName);

            IEnumerable result = new List<LeagueLeaderStat>();

            String queryString = GetBatLeagueLeadersQueryString(leagueId, divisionId, fieldName, allTimeLeaders);

            result = db.ExecuteQuery(typeof(LeaderStatRecord), queryString, new object[] { });
            return ProcessLeaders(result, fieldName, allTimeLeaders, limitRecords, abCheck, minAB);
        }

        static private bool NeedABCheck(String fieldName)
        {
            return (fieldName == "AVG" || fieldName == "SLG" || fieldName == "OBP" || fieldName == "OPS"); 
        }

        static private String GetBatLeagueLeadersQueryString(long leagueId, long divisionId, string fieldName, bool allTimeLeaders)
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

        private static String BuildSelectForBatLeaders(String fieldName)
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

        static public List<LeagueLeaderStat> GetPitchLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minIP, bool allTimeLeaders)
        {
            DB db = DBConnection.GetContext();
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            bool ipCheck = NeedIPCheck(fieldName);

            IEnumerable result = new List<LeagueLeaderStat>();

            String queryString = GetPitchLeagueLeadersQueryString(leagueId, divisionId, fieldName, allTimeLeaders);

            result = db.ExecuteQuery(typeof(LeaderStatRecord), queryString, new object[] { });
            return ProcessLeaders(result, fieldName, allTimeLeaders, limitRecords, ipCheck, minIP);
        }

        static private bool NeedIPCheck(String fieldName)
        {
            return (fieldName == "ERA" || fieldName == "WHIP" || fieldName == "K9" || fieldName == "BB9"
                            || fieldName == "SLG" || fieldName == "OBA" || fieldName == "TB"
                            || fieldName == "R" || fieldName == "ER");
        }

        static private String GetPitchLeagueLeadersQueryString(long leagueId, long divisionId, string fieldName, bool allTimeLeaders)
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

        static private String BuildSelectForPitchLeaders(String fieldName, out String orderBy)
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

        private static LeaderCategory GetLeaderCategoryFromName(string name, bool isBatLeader)
        {
            if (isBatLeader)
            {
                foreach(var lc in m_batCats)
                {
                    if (lc.Name == name)
                        return lc;
                }
            }
            else
            {
                foreach (var lc in m_pitchCats)
                {
                    if (lc.Name == name)
                        return lc;
                }
            }

            return null;
        }

        public static IQueryable<LeaderCategory> GetLeaderCategories(long accountId, long teamId, bool isBatLeader)
        {
            DB db = DBConnection.GetContext();

            return (from ll in db.DisplayLeagueLeaders
                    where ll.AccountId == accountId && ll.TeamId == teamId && ll.IsBatLeader == isBatLeader
                    select GetLeaderCategoryFromName(ll.FieldName, isBatLeader));
        }

        public static bool HasLeaderCategories(long accountId, long teamId)
        {
            DB db = DBConnection.GetContext();

            return (from ll in db.DisplayLeagueLeaders
                    where ll.AccountId == accountId && ll.TeamId == teamId
                    select ll).Any();
        }

        public static bool AddLeaderCategories(long accountId, long teamId, bool isBatLeader, IEnumerable<LeaderCategory> cat)
        {
            DB db = DBConnection.GetContext();

            // remove old ones first.
            var remove = (from ll in db.DisplayLeagueLeaders
                          where ll.AccountId == accountId && ll.TeamId == teamId && ll.IsBatLeader == isBatLeader
                          select ll);
            db.DisplayLeagueLeaders.DeleteAllOnSubmit(remove);
            db.SubmitChanges();

            if (cat == null)
                return true;

            foreach(var lc in cat)
            {
                db.DisplayLeagueLeaders.InsertOnSubmit(new SportsManager.Model.DisplayLeagueLeader()
                {
                    FieldName = lc.Name,
                    AccountId = accountId,
                    TeamId = teamId,
                    IsBatLeader = isBatLeader
                });
            }

            db.SubmitChanges();

            return true;
        }
    }
}

