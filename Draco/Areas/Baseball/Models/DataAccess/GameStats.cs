using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Linq.Dynamic;
using ModelObjects;
using SportsManager;


namespace DataAccess
{
    /// <summary>
    /// Summary description for GameStats
    /// </summary>
    static public class GameStats
    {
        static public Player[] GetPlayersWithNoGameBatStats(long gameId, long teamSeasonId)
        {
            ArrayList players = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayersWithNoGameBatStats", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        Contact contactInfo = Contacts.GetContact(dr.GetInt64(6));
                        players.Add(new Player(dr.GetInt64(0), dr.GetInt64(2), dr.GetInt32(3), contactInfo, dr.GetBoolean(5),
                            dr.GetBoolean(7), dr.GetInt64(8), DateTime.Now, string.Empty));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (Player[])players.ToArray(typeof(Player));
        }

        static public Player[] GetPlayersWithNoGamePitchStats(long gameId, long teamSeasonId)
        {
            ArrayList players = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayersWithNoGamePitchStats", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        Contact contactInfo = Contacts.GetContact(dr.GetInt64(6));
                        players.Add(new Player(dr.GetInt64(0), dr.GetInt64(2), dr.GetInt32(3), contactInfo, dr.GetBoolean(5),
                            dr.GetBoolean(7), dr.GetInt64(8), DateTime.Now, string.Empty));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (Player[])players.ToArray(typeof(Player));
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
        static public IEnumerable<GameBatStats> GetBatTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
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
                        join rs in db.RosterSeasons on bss.PlayerId equals rs.id
                        join ts in db.TeamsSeasons on bss.TeamId equals ts.id
                        where ts.TeamId == teamId
                        group bss by rs.PlayerId into g
                        select new GameCareerBatStats
                        {
                            PlayerId = g.Key,
                            AB = g.Sum(b => b.AB),
                            H = g.Sum(b => b.H),
                            R = g.Sum(b => b.R),
                            D = g.Sum(b => b._2B),
                            T = g.Sum(b => b._3B),
                            HR = g.Sum(b => b.HR),
                            RBI = g.Sum(b => b.RBI),
                            SO = g.Sum(b => b.SO),
                            BB = g.Sum(b => b.BB),
                            RE = g.Sum(b => b.RE),
                            HBP = g.Sum(b => b.HBP),
                            INTR = g.Sum(b => b.INTR),
                            SF = g.Sum(b => b.SF),
                            SH = g.Sum(b => b.SH),
                            SB = g.Sum(b => b.SB),
                            CS = g.Sum(b => b.CS),
                            LOB = g.Sum(b => b.LOB),
                            TB = g.Sum(b => b.TB).Value,
                            PA = g.Sum(b => b.PA).Value,
                            AVG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB) : 0.000,
                            SLG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000,
                            OBA = g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00,
                            OPS = (g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000) +
                                  (g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00)
                        }).OrderBy(sortField + " " + sortOrder);
            }
            else
            {
                return (from bss in db.batstatsums
                        where bss.TeamId == teamId
                        group bss by bss.PlayerId into g
                        select new GameBatStats
                        {
                            PlayerId = g.Key,
                            AB = g.Sum(b => b.AB),
                            H = g.Sum(b => b.H),
                            R = g.Sum(b => b.R),
                            D = g.Sum(b => b._2B),
                            T = g.Sum(b => b._3B),
                            HR = g.Sum(b => b.HR),
                            RBI = g.Sum(b => b.RBI),
                            SO = g.Sum(b => b.SO),
                            BB = g.Sum(b => b.BB),
                            RE = g.Sum(b => b.RE),
                            HBP = g.Sum(b => b.HBP),
                            INTR = g.Sum(b => b.INTR),
                            SF = g.Sum(b => b.SF),
                            SH = g.Sum(b => b.SH),
                            SB = g.Sum(b => b.SB),
                            CS = g.Sum(b => b.CS),
                            LOB = g.Sum(b => b.LOB),
                            TB = g.Sum(b => b.TB).Value,
                            PA = g.Sum(b => b.PA).Value,
                            AVG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB) : 0.000,
                            SLG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000,
                            OBA = g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00,
                            OPS = (g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000) +
                                  (g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00)
                        }).OrderBy(sortField + " " + sortOrder);

            }
        }

        static public GameBatStats GetBatTeamSeasonTotals(long teamSeasonId, long seasonId)
        {
            GameBatStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatTeamSeasonTotals", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
                    myCommand.Parameters.Add("@seasonId", SqlDbType.BigInt).Value = seasonId;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameBatStats(0, 0, 0, teamSeasonId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
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

        static public IEnumerable<GameBatStats> GetBatLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats, out int totalRecords)
        {
            DB db = DBConnection.GetContext();

            if (historicalStats)
            {
                var batstats = (from bss in db.batstatsums
                                join rs in db.RosterSeasons on bss.PlayerId equals rs.id
                                join leagueSchedule in db.LeagueSchedules on bss.GameId equals leagueSchedule.id
                                join leagueSeason in db.LeagueSeasons on leagueSchedule.LeagueId equals leagueSeason.id
                                where leagueSchedule.GameStatus == 1 && leagueSeason.LeagueId == leagueId
                                group bss by rs.PlayerId into g
                                select new GameCareerBatStats
                                {
                                    PlayerId = g.Key,
                                    AB = g.Sum(b => b.AB),
                                    H = g.Sum(b => b.H),
                                    R = g.Sum(b => b.R),
                                    D = g.Sum(b => b._2B),
                                    T = g.Sum(b => b._3B),
                                    HR = g.Sum(b => b.HR),
                                    RBI = g.Sum(b => b.RBI),
                                    SO = g.Sum(b => b.SO),
                                    BB = g.Sum(b => b.BB),
                                    HBP = g.Sum(b => b.HBP),
                                    INTR = g.Sum(b => b.INTR),
                                    SF = g.Sum(b => b.SF),
                                    SH = g.Sum(b => b.SH),
                                    SB = g.Sum(b => b.SB),
                                    CS = g.Sum(b => b.CS),
                                    LOB = g.Sum(b => b.LOB),
                                    TB = g.Sum(b => b.TB).Value,
                                    PA = g.Sum(b => b.PA).Value,
                                    AVG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB) : 0.000,
                                    SLG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000,
                                    OBA = g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00,
                                    OPS = (g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000) +
                                          (g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00)
                                }).OrderBy(sortField + " " + sortOrder);

                totalRecords = batstats.Count();

                return batstats;
            }
            else
            {
                var batstats = (from bss in db.batstatsums
                                join ls in db.LeagueSchedules on bss.GameId equals ls.id
                                where ls.GameStatus == 1 && ls.LeagueId == leagueId
                                group bss by bss.PlayerId into g
                                select new GameBatStats
                                {
                                    PlayerId = g.Key,
                                    AB = g.Sum(b => b.AB),
                                    H = g.Sum(b => b.H),
                                    R = g.Sum(b => b.R),
                                    D = g.Sum(b => b._2B),
                                    T = g.Sum(b => b._3B),
                                    HR = g.Sum(b => b.HR),
                                    RBI = g.Sum(b => b.RBI),
                                    SO = g.Sum(b => b.SO),
                                    BB = g.Sum(b => b.BB),
                                    HBP = g.Sum(b => b.HBP),
                                    INTR = g.Sum(b => b.INTR),
                                    SF = g.Sum(b => b.SF),
                                    SH = g.Sum(b => b.SH),
                                    SB = g.Sum(b => b.SB),
                                    CS = g.Sum(b => b.CS),
                                    LOB = g.Sum(b => b.LOB),
                                    TB = g.Sum(b => b.TB).Value,
                                    PA = g.Sum(b => b.PA).Value,
                                    AVG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB) : 0.000,
                                    SLG = g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000,
                                    OBA = g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00,
                                    OPS = (g.Sum(b => b.AB) > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB) : 0.000) +
                                          (g.Sum(b => b.OBADenominator).Value > 0 ? (double)g.Sum(b => b.OBANumerator).Value / (double)g.Sum(b => b.OBADenominator).Value : 0.00)
                                }).OrderBy(sortField + " " + sortOrder);

                totalRecords = batstats.Count();

                return batstats;
            }
        }

        static public IEnumerable<GamePitchStats> GetPitchTeamPlayerTotals(long teamId, string sortField, string sortOrder, bool historicalStats)
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
                        join rs in db.RosterSeasons on bss.PlayerId equals rs.id
                        join ts in db.TeamsSeasons on bss.TeamId equals ts.id
                        where ts.TeamId == teamId
                        group bss by rs.PlayerId into g
                        select new GameCareerPitchStats
                        {
                            PlayerId = g.Key,
                            IP = g.Sum(b => b.IP),
                            IP2 = g.Sum(b => b.IP2),
                            IPDecimal = (double)g.Sum(b => b.IP) + ((int)(g.Sum(b => b.IP2) / 3)) + ((g.Sum(b => b.IP2) % 3) / 10.0),
                            BF = g.Sum(b => b.BF),
                            W = g.Sum(b => b.W),
                            L = g.Sum(b => b.L),
                            S = g.Sum(b => b.S),
                            H = g.Sum(b => b.H),
                            R = g.Sum(b => b.R),
                            ER = g.Sum(b => b.ER),
                            D = g.Sum(b => b._2B),
                            T = g.Sum(b => b._3B),
                            HR = g.Sum(b => b.HR),
                            SO = g.Sum(b => b.SO),
                            BB = g.Sum(b => b.BB),
                            WP = g.Sum(b => b.WP),
                            HBP = g.Sum(b => b.HBP),
                            BK = g.Sum(b => b.BK),
                            SC = g.Sum(b => b.SC),
                            TB = g.Sum(b => b.TB).Value,
                            AB = g.Sum(b => b.AB).Value,
                            OBA = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB).Value : 0.00,
                            SLG = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB).Value : 0.00,
                            ERA = g.Sum(b => b.IPNumerator).Value > 0 ? (g.Sum(b => b.ER) * 9.0) / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                            WHIP = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.WHIPNumerator).Value / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                            K9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.SO) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0,
                            BB9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.BB) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0
                        }).OrderBy(sortField + " " + sortOrder);
            }
            else
            {
                return (from bss in db.pitchstatsums
                        where bss.TeamId == teamId
                        group bss by bss.PlayerId into g
                        select new GamePitchStats
                        {
                            PlayerId = g.Key,
                            IP = g.Sum(b => b.IP),
                            IP2 = g.Sum(b => b.IP2),
                            IPDecimal = (double)g.Sum(b => b.IP) + ((int)(g.Sum(b => b.IP2) / 3)) + ((g.Sum(b => b.IP2) % 3) / 10.0),
                            BF = g.Sum(b => b.BF),
                            W = g.Sum(b => b.W),
                            L = g.Sum(b => b.L),
                            S = g.Sum(b => b.S),
                            H = g.Sum(b => b.H),
                            R = g.Sum(b => b.R),
                            ER = g.Sum(b => b.ER),
                            D = g.Sum(b => b._2B),
                            T = g.Sum(b => b._3B),
                            HR = g.Sum(b => b.HR),
                            SO = g.Sum(b => b.SO),
                            BB = g.Sum(b => b.BB),
                            WP = g.Sum(b => b.WP),
                            HBP = g.Sum(b => b.HBP),
                            BK = g.Sum(b => b.BK),
                            SC = g.Sum(b => b.SC),
                            TB = g.Sum(b => b.TB).Value,
                            AB = g.Sum(b => b.AB).Value,
                            OBA = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB).Value : 0.00,
                            SLG = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB).Value : 0.00,
                            ERA = g.Sum(b => b.IPNumerator).Value > 0 ? (g.Sum(b => b.ER) * 9.0) / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                            WHIP = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.WHIPNumerator).Value / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                            K9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.SO) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0,
                            BB9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.BB) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0
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

        static public GamePitchStats GetPitchTeamSeasonTotals(long teamId, long seasonId)
        {
            GamePitchStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchTeamSeasonTotals", myConnection);
                    myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@seasonId", SqlDbType.BigInt).Value = seasonId;
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

        static public IEnumerable<GamePitchStats> GetPitchLeaguePlayerTotals(long leagueId, string sortField, string sortOrder, bool historicalStats, out int totalRecords)
        {
            DB db = DBConnection.GetContext();

            if (historicalStats)
            {
                var pitchstats = (from pss in db.pitchstatsums
                                  join rs in db.RosterSeasons on pss.PlayerId equals rs.id
                                  join leagueSchedule in db.LeagueSchedules on pss.GameId equals leagueSchedule.id
                                  join leagueSeason in db.LeagueSeasons on leagueSchedule.LeagueId equals leagueSeason.id
                                  where leagueSchedule.GameStatus == 1 && leagueSeason.LeagueId == leagueId
                                  group pss by rs.PlayerId into g
                                  select new GameCareerPitchStats
                                  {
                                      PlayerId = g.Key,
                                      IP = g.Sum(b => b.IP),
                                      IP2 = g.Sum(b => b.IP2),
                                      IPDecimal = (double)g.Sum(b => b.IP) + ((int)(g.Sum(b => b.IP2) / 3)) + ((g.Sum(b => b.IP2) % 3) / 10.0),
                                      BF = g.Sum(b => b.BF),
                                      W = g.Sum(b => b.W),
                                      L = g.Sum(b => b.L),
                                      S = g.Sum(b => b.S),
                                      H = g.Sum(b => b.H),
                                      R = g.Sum(b => b.R),
                                      ER = g.Sum(b => b.ER),
                                      D = g.Sum(b => b._2B),
                                      T = g.Sum(b => b._3B),
                                      HR = g.Sum(b => b.HR),
                                      SO = g.Sum(b => b.SO),
                                      BB = g.Sum(b => b.BB),
                                      WP = g.Sum(b => b.WP),
                                      HBP = g.Sum(b => b.HBP),
                                      BK = g.Sum(b => b.BK),
                                      SC = g.Sum(b => b.SC),
                                      TB = g.Sum(b => b.TB).Value,
                                      AB = g.Sum(b => b.AB).Value,
                                      OBA = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB).Value : 0.00,
                                      SLG = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB).Value : 0.00,
                                      ERA = g.Sum(b => b.IPNumerator).Value > 0 ? (g.Sum(b => b.ER) * 9.0) / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                                      WHIP = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.WHIPNumerator).Value / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                                      K9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.SO) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0,
                                      BB9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.BB) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0
                                  }).OrderBy(sortField + " " + sortOrder);

                totalRecords = pitchstats.Count();

                return pitchstats;
            }
            else
            {
                var pitchstats = (from pss in db.pitchstatsums
                                  join ls in db.LeagueSchedules on pss.GameId equals ls.id
                                  where ls.GameStatus == 1 && ls.LeagueId == leagueId
                                  group pss by pss.PlayerId into g
                                  select new GamePitchStats
                                  {
                                      PlayerId = g.Key,
                                      IP = g.Sum(b => b.IP),
                                      IP2 = g.Sum(b => b.IP2),
                                      IPDecimal = (double)g.Sum(b => b.IP) + ((int)g.Sum(b => b.IP2) / 3) + ((g.Sum(b => b.IP2) % 3) / 10.0),
                                      BF = g.Sum(b => b.BF),
                                      W = g.Sum(b => b.W),
                                      L = g.Sum(b => b.L),
                                      S = g.Sum(b => b.S),
                                      H = g.Sum(b => b.H),
                                      R = g.Sum(b => b.R),
                                      ER = g.Sum(b => b.ER),
                                      D = g.Sum(b => b._2B),
                                      T = g.Sum(b => b._3B),
                                      HR = g.Sum(b => b.HR),
                                      SO = g.Sum(b => b.SO),
                                      BB = g.Sum(b => b.BB),
                                      WP = g.Sum(b => b.WP),
                                      HBP = g.Sum(b => b.HBP),
                                      BK = g.Sum(b => b.BK),
                                      SC = g.Sum(b => b.SC),
                                      TB = g.Sum(b => b.TB).Value,
                                      AB = g.Sum(b => b.AB).Value,
                                      OBA = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.H) / (double)g.Sum(b => b.AB).Value : 0.00,
                                      SLG = g.Sum(b => b.AB).Value > 0 ? (double)g.Sum(b => b.TB).Value / (double)g.Sum(b => b.AB).Value : 0.00,
                                      ERA = g.Sum(b => b.IPNumerator).Value > 0 ? (g.Sum(b => b.ER) * 9.0) / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                                      WHIP = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.WHIPNumerator).Value / (g.Sum(b => b.IPNumerator).Value / 3.0) : 0.000,
                                      K9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.SO) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0,
                                      BB9 = g.Sum(b => b.IPNumerator).Value > 0 ? g.Sum(b => b.BB) / (g.Sum(b => b.IPNumerator).Value / 3.0) * 9.0 : 0.0
                                  }).OrderBy(sortField + " " + sortOrder);

                totalRecords = pitchstats.Count();

                return pitchstats;
            }
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
            GameBatStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatGameTotals", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameBatStats(0, 0, gameId, teamId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GamePitchStats GetPitchGameTotals(long gameId, long teamId)
        {
            GamePitchStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchGameTotals", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GamePitchStats(0, 0, gameId, teamId, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
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

        static public GameBatStats[] GetBatGameStats(long gameId, long teamId)
        {
            ArrayList stats = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatGameStats", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameBatStats(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetInt64(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17), dr.GetInt32(18), dr.GetInt32(19), dr.GetInt32(20)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (GameBatStats[])stats.ToArray(typeof(GameBatStats));
        }

        static public GamePitchStats[] GetPitchGameStats(long gameId, long teamId)
        {
            ArrayList stats = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchGameStats", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GamePitchStats(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetInt64(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17), dr.GetInt32(18), dr.GetInt32(18), dr.GetInt32(19)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (GamePitchStats[])stats.ToArray(typeof(GamePitchStats));
        }

        static public GameFieldStats[] GetFieldGameStats(long gameId, long teamId)
        {
            ArrayList stats = new ArrayList();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetFieldGameStats", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameFieldStats(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetInt64(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (GameFieldStats[])stats.ToArray(typeof(GameFieldStats));
        }

        static public int UpdateBattingGameStats(GameBatStats g)
        {
            int rc = 0;

            if (!g.IsValid())
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateBattingGameStats", myConnection);
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = g.Id;
                    myCommand.Parameters.Add("@ab", SqlDbType.Int).Value = g.AB;
                    myCommand.Parameters.Add("@h", SqlDbType.Int).Value = g.H;
                    myCommand.Parameters.Add("@r", SqlDbType.Int).Value = g.R;
                    myCommand.Parameters.Add("@d", SqlDbType.Int).Value = g.D;
                    myCommand.Parameters.Add("@t", SqlDbType.Int).Value = g.T;
                    myCommand.Parameters.Add("@hr", SqlDbType.Int).Value = g.HR;
                    myCommand.Parameters.Add("@rbi", SqlDbType.Int).Value = g.RBI;
                    myCommand.Parameters.Add("@so", SqlDbType.Int).Value = g.SO;
                    myCommand.Parameters.Add("@bb", SqlDbType.Int).Value = g.BB;
                    myCommand.Parameters.Add("@sb", SqlDbType.Int).Value = g.SB;
                    myCommand.Parameters.Add("@cs", SqlDbType.Int).Value = g.CS;
                    myCommand.Parameters.Add("@re", SqlDbType.Int).Value = g.RE;
                    myCommand.Parameters.Add("@hb", SqlDbType.Int).Value = g.HBP;
                    myCommand.Parameters.Add("@intr", SqlDbType.Int).Value = g.INTR;
                    myCommand.Parameters.Add("@sf", SqlDbType.Int).Value = g.SF;
                    myCommand.Parameters.Add("@sh", SqlDbType.Int).Value = g.SH;
                    myCommand.Parameters.Add("@lob", SqlDbType.Int).Value = g.LOB;
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

        static public long AddBattingGameStats(GameBatStats g)
        {
            long rc = 0;

            if (!g.IsValid())
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.InsertBattingGameStats", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = g.GameId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = g.TeamId;
                    myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = g.PlayerId;
                    myCommand.Parameters.Add("@ab", SqlDbType.Int).Value = g.AB;
                    myCommand.Parameters.Add("@h", SqlDbType.Int).Value = g.H;
                    myCommand.Parameters.Add("@r", SqlDbType.Int).Value = g.R;
                    myCommand.Parameters.Add("@d", SqlDbType.Int).Value = g.D;
                    myCommand.Parameters.Add("@t", SqlDbType.Int).Value = g.T;
                    myCommand.Parameters.Add("@hr", SqlDbType.Int).Value = g.HR;
                    myCommand.Parameters.Add("@rbi", SqlDbType.Int).Value = g.RBI;
                    myCommand.Parameters.Add("@so", SqlDbType.Int).Value = g.SO;
                    myCommand.Parameters.Add("@bb", SqlDbType.Int).Value = g.BB;
                    myCommand.Parameters.Add("@sb", SqlDbType.Int).Value = g.SB;
                    myCommand.Parameters.Add("@cs", SqlDbType.Int).Value = g.CS;
                    myCommand.Parameters.Add("@re", SqlDbType.Int).Value = g.RE;
                    myCommand.Parameters.Add("@hb", SqlDbType.Int).Value = g.HBP;
                    myCommand.Parameters.Add("@intr", SqlDbType.Int).Value = g.INTR;
                    myCommand.Parameters.Add("@sf", SqlDbType.Int).Value = g.SF;
                    myCommand.Parameters.Add("@sh", SqlDbType.Int).Value = g.SH;
                    myCommand.Parameters.Add("@lob", SqlDbType.Int).Value = g.LOB;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = (long)myCommand.ExecuteScalar();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rc);
        }

        static public int UpdatePitchingGameStats(GamePitchStats g)
        {
            int rc = 0;

            if (!g.IsValid())
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdatePitchingGameStats", myConnection);
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = g.Id;
                    myCommand.Parameters.Add("@ip", SqlDbType.Int).Value = g.IP;
                    myCommand.Parameters.Add("@ip2", SqlDbType.Int).Value = g.IP2;
                    myCommand.Parameters.Add("@bf", SqlDbType.Int).Value = g.BF;
                    myCommand.Parameters.Add("@w", SqlDbType.Int).Value = g.W;
                    myCommand.Parameters.Add("@l", SqlDbType.Int).Value = g.L;
                    myCommand.Parameters.Add("@s", SqlDbType.Int).Value = g.S;
                    myCommand.Parameters.Add("@h", SqlDbType.Int).Value = g.H;
                    myCommand.Parameters.Add("@r", SqlDbType.Int).Value = g.R;
                    myCommand.Parameters.Add("@er", SqlDbType.Int).Value = g.ER;
                    myCommand.Parameters.Add("@d", SqlDbType.Int).Value = g.D;
                    myCommand.Parameters.Add("@t", SqlDbType.Int).Value = g.T;
                    myCommand.Parameters.Add("@hr", SqlDbType.Int).Value = g.HR;
                    myCommand.Parameters.Add("@so", SqlDbType.Int).Value = g.SO;
                    myCommand.Parameters.Add("@bb", SqlDbType.Int).Value = g.BB;
                    myCommand.Parameters.Add("@wp", SqlDbType.Int).Value = g.WP;
                    myCommand.Parameters.Add("@hb", SqlDbType.Int).Value = g.HBP;
                    myCommand.Parameters.Add("@bk", SqlDbType.Int).Value = g.BK;
                    myCommand.Parameters.Add("@sc", SqlDbType.Int).Value = g.SC;
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

        static public long AddPitchingGameStats(GamePitchStats g)
        {
            long rc = 0;

            if (!g.IsValid())
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.InsertPitchingGameStats", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = g.GameId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = g.TeamId;
                    myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = g.PlayerId;
                    myCommand.Parameters.Add("@ip", SqlDbType.Int).Value = g.IP;
                    myCommand.Parameters.Add("@ip2", SqlDbType.Int).Value = g.IP2;
                    myCommand.Parameters.Add("@bf", SqlDbType.Int).Value = g.BF;
                    myCommand.Parameters.Add("@w", SqlDbType.Int).Value = g.W;
                    myCommand.Parameters.Add("@l", SqlDbType.Int).Value = g.L;
                    myCommand.Parameters.Add("@s", SqlDbType.Int).Value = g.S;
                    myCommand.Parameters.Add("@h", SqlDbType.Int).Value = g.H;
                    myCommand.Parameters.Add("@r", SqlDbType.Int).Value = g.R;
                    myCommand.Parameters.Add("@er", SqlDbType.Int).Value = g.ER;
                    myCommand.Parameters.Add("@d", SqlDbType.Int).Value = g.D;
                    myCommand.Parameters.Add("@t", SqlDbType.Int).Value = g.T;
                    myCommand.Parameters.Add("@hr", SqlDbType.Int).Value = g.HR;
                    myCommand.Parameters.Add("@so", SqlDbType.Int).Value = g.SO;
                    myCommand.Parameters.Add("@bb", SqlDbType.Int).Value = g.BB;
                    myCommand.Parameters.Add("@wp", SqlDbType.Int).Value = g.WP;
                    myCommand.Parameters.Add("@hb", SqlDbType.Int).Value = g.HBP;
                    myCommand.Parameters.Add("@bk", SqlDbType.Int).Value = g.BK;
                    myCommand.Parameters.Add("@sc", SqlDbType.Int).Value = g.SC;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = (long)myCommand.ExecuteScalar();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rc = 0;
            }

            return (rc);
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

        static public int RemoveGameBatStats(GameBatStats g)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteBatStats", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@statId", SqlDbType.BigInt).Value = g.Id;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();

                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rc = 0;
            }

            return rc;
        }

        static public int RemoveGamePitchStats(GamePitchStats g)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeletePitchStats", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@statId", SqlDbType.BigInt).Value = g.Id;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();

                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rc = 0;
            }

            return rc;
        }

        static public int RemoveGameFieldStats(GameFieldStats g)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteFieldStats", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@statId", SqlDbType.BigInt).Value = g.Id;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();

                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rc = 0;
            }

            return rc;
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
            GameRecap recap = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetGameRecap", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        recap = new GameRecap(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2));
                    }
                    else
                    {
                        recap = new GameRecap(gameId, teamId, string.Empty);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return recap;
        }

        static public int UpdateGameRecap(GameRecap recap)
        {
            int rc = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateGameRecap", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = recap.TeamId;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = recap.GameId;
                    myCommand.Parameters.Add("@recap", SqlDbType.Text, recap.Recap.Length).Value = recap.Recap;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rc = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rc = 0;
            }

            return rc;
        }


        static public ICollection<GameCareerBatStats> GetBatPlayerCareer(long playerSeasonId, bool fromRosterId)
        {
            List<GameCareerBatStats> stats = new List<GameCareerBatStats>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatPlayerCareer", myConnection);
                    myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
                    myCommand.Parameters.Add("@fromRosterId", SqlDbType.Int).Value = fromRosterId ? 1 : 0;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameCareerBatStats(dr.GetInt64(17), dr.GetString(0), dr.GetString(1), dr.GetString(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GameCareerBatStats GetBatPlayerCareerTotal(long playerSeasonId, int fromRosterId)
        {
            GameCareerBatStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetBatPlayerCareerTotal", myConnection);
                    myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
                    myCommand.Parameters.Add("@fromRosterId", SqlDbType.Int).Value = @fromRosterId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats = new GameCareerBatStats(dr.GetInt64(14), String.Empty, String.Empty, String.Empty, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public ICollection<GameCareerPitchStats> GetPitchPlayerCareer(long playerSeasonId, bool fromRosterId)
        {
            List<GameCareerPitchStats> stats = new List<GameCareerPitchStats>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchPlayerCareer", myConnection);
                    myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
                    myCommand.Parameters.Add("@fromRosterId", SqlDbType.Int).Value = fromRosterId ? 1 : 0;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        stats.Add(new GameCareerPitchStats(dr.GetInt64(21), dr.GetString(0), dr.GetString(1), dr.GetString(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17), dr.GetInt32(18), dr.GetInt32(19), dr.GetInt32(20)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static public GameCareerPitchStats GetPitchPlayerCareerTotal(long playerSeasonId, int fromRosterId)
        {
            GameCareerPitchStats stats = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPitchPlayerCareerTotal", myConnection);
                    myCommand.Parameters.Add("@playerSeasonId", SqlDbType.BigInt).Value = playerSeasonId;
                    myCommand.Parameters.Add("@fromRosterId", SqlDbType.Int).Value = @fromRosterId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        stats = new GameCareerPitchStats(dr.GetInt64(18), String.Empty, String.Empty, String.Empty, dr.GetInt32(0), dr.GetInt32(1), dr.GetInt32(2), dr.GetInt32(3), dr.GetInt32(4), dr.GetInt32(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8), dr.GetInt32(9), dr.GetInt32(10), dr.GetInt32(11), dr.GetInt32(12), dr.GetInt32(13), dr.GetInt32(14), dr.GetInt32(15), dr.GetInt32(16), dr.GetInt32(17));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
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
            double curMin = 0.0f;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CalculateMin", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@minNum", SqlDbType.Float).Value = minNum;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        curMin = dr.GetDouble(0);
                        if (curMin < 1.0)
                            curMin = 1.0;
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                curMin = 1.0;
            }

            return (int)curMin;
        }

        static public List<LeagueLeaderStat> GetBatLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minAB, bool allTimeLeaders)
        {
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();
            bool abCheck = false;

            if (fieldName == "AVG" || fieldName == "SLG")
            {
                abCheck = true;
            }

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;
                    if (divisionId == 0)
                    {
                        myCommand = new SqlCommand("dbo.GetBatLeagueLeaders", myConnection);
                    }
                    else
                    {
                        myCommand = new SqlCommand("dbo.GetBatLeagueLeadersByDivision", myConnection);
                        myCommand.Parameters.Add("@divisionId", SqlDbType.BigInt).Value = divisionId;
                    }

                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@fieldName", SqlDbType.VarChar, 10).Value = fieldName;
                    myCommand.Parameters.Add("@allTimeLeaders", SqlDbType.Bit).Value = (allTimeLeaders) ? 1 : 0;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    stats = ProcessLeaders(dr, fieldName, allTimeLeaders, limitRecords, abCheck, minAB, "totalAB");

                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }

        static private List<LeagueLeaderStat> ProcessLeaders(SqlDataReader dr, string fieldName, bool allTimeLeaders, int limitRecords, bool checkMin, int minVal, string checkField)
        {
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            Dictionary<double, List<LeagueLeaderStat>> leaderList = new Dictionary<double, List<LeagueLeaderStat>>();
            List<double> leaderKeys = new List<double>();

            int numRecords = 0;

            while (dr.Read())
            {
                if (!checkMin || (checkMin && ((int)dr.GetDecimal(dr.GetOrdinal(checkField)) >= minVal)))
                {
                    double totalValue = (double)dr.GetDecimal(dr.GetOrdinal(fieldName));
                    LeagueLeaderStat stat = new LeagueLeaderStat(fieldName, dr.GetInt64(0), allTimeLeaders ? 0 : dr.GetInt64(1), totalValue);
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
                if (stats.Count == 0 && leaderStats.Count > 1)
                {
                    // add tie indicator for overall leader
                    stats.Add(new LeagueLeaderStat(leaderStats.Count, leaderKey));
                    addedLeaderTie = true;
                }

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

            return stats;
        }

        static public List<LeagueLeaderStat> GetPitchLeagueLeaders(long leagueId, long divisionId, string fieldName, int limitRecords, int minIP, bool allTimeLeaders)
        {
            List<LeagueLeaderStat> stats = new List<LeagueLeaderStat>();

            bool ipCheck = false;

            if (fieldName == "ERA" || fieldName == "WHIP")
                ipCheck = true;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand;

                    if (divisionId == 0)
                    {
                        myCommand = new SqlCommand("dbo.GetPitchLeagueLeaders", myConnection);
                    }
                    else
                    {
                        myCommand = new SqlCommand("dbo.GetPitchLeagueLeadersByDivision", myConnection);
                        myCommand.Parameters.Add("@divisionId", SqlDbType.BigInt).Value = divisionId;
                    }

                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@fieldName", SqlDbType.VarChar, 10).Value = fieldName;
                    myCommand.Parameters.Add("@allTimeLeaders", SqlDbType.Bit).Value = (allTimeLeaders) ? 1 : 0;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    stats = ProcessLeaders(dr, fieldName, allTimeLeaders, limitRecords, ipCheck, minIP, "totalIP");

                }

            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return stats;
        }
    }
}

