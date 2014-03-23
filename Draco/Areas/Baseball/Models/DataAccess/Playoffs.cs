using System;
using System.Configuration;
using System.Data;
using System.Collections;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web.SessionState;
using System.Web.UI.WebControls;

using ModelObjects;

namespace DataAccess
{

    /// <summary>
    /// Summary description for Playoffs
    /// </summary>
    static public class Playoffs
    {
        static public long GetCurrentPlayoff()
        {
            long aId = 0;

            System.Web.HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                aId = DataAccess.Playoffs.GetCurrentPlayoff(context.Session);
            }

            return aId;
        }

        static public long GetCurrentPlayoff(HttpSessionState s)
        {
            return s["AdminCurrentPlayoff"] != null ? Int32.Parse((string)s["AdminCurrentPlayoff"]) : 0;
        }

        static public List<ListItem> GetTeamPlayoffType()
        {
            List<ListItem> li = new List<ListItem>(2);

            li.Add(new ListItem("Seed #", "SEED"));
            li.Add(new ListItem("Bye", "BYE"));

            return li;
        }

        static public string GetPlayoffName(long id)
        {
            string playoffName = String.Empty;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffName", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = id;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffName = dr.GetString(0);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffName;
        }

        static public List<PlayoffSetup> GetPlayoffs(long seasonId, bool onlyActive)
        {
            List<PlayoffSetup> playoffs = new List<PlayoffSetup>();

            if (seasonId == 0)
                return playoffs;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffs", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@seasonId", SqlDbType.BigInt).Value = seasonId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        bool isActive = dr.GetBoolean(4);
                        if ((onlyActive && isActive) || !onlyActive)
                            playoffs.Add(new PlayoffSetup(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt32(2), dr.GetString(3), isActive));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffs;
        }

        static public PlayoffSetup GetPlayoffSetup(long playoffId)
        {
            PlayoffSetup playoffs = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffSetup", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffs = new PlayoffSetup(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt32(2), dr.GetString(3), dr.GetBoolean(4));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffs;
        }

        static public bool ModifyPlayoff(PlayoffSetup p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayoff", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = p.Id;
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = p.LeagueId;
                    myCommand.Parameters.Add("@numTeams", SqlDbType.Int).Value = p.NumTeams;
                    myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = p.Description;
                    myCommand.Parameters.Add("@active", SqlDbType.Bit).Value = p.Active;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public bool AddPlayoff(PlayoffSetup p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreatePlayoff", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = p.LeagueId;
                    myCommand.Parameters.Add("@numTeams", SqlDbType.Int).Value = p.NumTeams;
                    myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = p.Description;
                    myCommand.Parameters.Add("@active", SqlDbType.Bit).Value = p.Active;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public bool RemovePlayoff(PlayoffSetup p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeletePlayoff", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = p.Id;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();

                    string baseFileName = ConfigurationManager.AppSettings["UploadDir"];

                    try
                    {
                        System.IO.File.Delete(baseFileName + "tn-" + p.Id.ToString() + "playoff.svg");
                    }
                    catch (Exception)
                    {
                    }

                    try
                    {
                        System.IO.File.Delete(baseFileName + p.Id.ToString() + "playoff.svg");
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public List<PlayoffSeed> GetPlayoffSeeds(long playoffId)
        {
            List<PlayoffSeed> playoffs = new List<PlayoffSeed>();
            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffSeeds", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = playoffId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        playoffs.Add(new PlayoffSeed(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetInt32(3)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffs;
        }

        static public bool ModifyPlayoffSeeds(long playoffId, long[] seedIds, long[] seedTeamIds)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {

                    SqlCommand updateCommand = new SqlCommand("dbo.UpdatePlayoffSeed", myConnection);
                    updateCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    SqlParameter idParam = updateCommand.Parameters.Add("@id", SqlDbType.BigInt);
                    updateCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;
                    SqlParameter teamIdParam = updateCommand.Parameters.Add("@teamId", SqlDbType.BigInt);
                    SqlParameter seedNoParam = updateCommand.Parameters.Add("@seedNo", SqlDbType.Int);


                    SqlCommand insertCommand = new SqlCommand("dbo.CreatePlayoffSeed", myConnection);
                    insertCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    insertCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;
                    SqlParameter teamId2Param = insertCommand.Parameters.Add("@teamId", SqlDbType.BigInt);
                    SqlParameter seedNo2Param = insertCommand.Parameters.Add("@seedNo", SqlDbType.Int);

                    myConnection.Open();
                    updateCommand.Prepare();
                    insertCommand.Prepare();

                    int i = 0;
                    foreach (int seedId in seedIds)
                    {
                        if (seedId > 0)
                        {
                            teamIdParam.Value = seedTeamIds[i];
                            seedNoParam.Value = i + 1;
                            idParam.Value = seedId;

                            updateCommand.ExecuteNonQuery();
                        }
                        else
                        {
                            teamId2Param.Value = seedTeamIds[i];
                            seedNo2Param.Value = i + 1;

                            insertCommand.ExecuteNonQuery();
                        }

                        i++;
                    }
                }

                rowCount = 1;
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public bool ModifyPlayoffSeed(PlayoffSeed ps)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {

                    SqlCommand updateCommand = new SqlCommand("dbo.UpdatePlayoffSeed", myConnection);
                    updateCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    updateCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = ps.Id;
                    updateCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = ps.PlayoffId;
                    updateCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = ps.TeamId;
                    updateCommand.Parameters.Add("@seedNo", SqlDbType.Int).Value = ps.SeedNo;

                    myConnection.Open();
                    updateCommand.Prepare();

                    rowCount = updateCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount > 0);
        }

        static public List<PlayoffBracket> GetPlayoffBrackets(long playoffId)
        {
            List<PlayoffBracket> playoffBrackets = new List<PlayoffBracket>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffBrackets", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                        playoffBrackets.Add(new PlayoffBracket(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetString(3), dr.GetInt64(4), dr.GetString(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8)));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }


            return playoffBrackets;
        }

        static public PlayoffBracket GetPlayoffBracket(long playoffId, int roundNo, int gameNo)
        {
            PlayoffBracket playoffBracket = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffBracketByRound", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;
                    myCommand.Parameters.Add("@roundNo", SqlDbType.BigInt).Value = roundNo;
                    myCommand.Parameters.Add("@gameNo", SqlDbType.BigInt).Value = gameNo;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffBracket = new PlayoffBracket(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetString(3), dr.GetInt64(4), dr.GetString(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffBracket;
        }

        static public PlayoffBracket GetPlayoffBracket(long id)
        {
            PlayoffBracket playoffBracket = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffBracket", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffBracket = new PlayoffBracket(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetString(3), dr.GetInt64(4), dr.GetString(5), dr.GetInt32(6), dr.GetInt32(7), dr.GetInt32(8));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffBracket;
        }

        static public bool RemovePlayoffBracket(PlayoffBracket p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeletePlayoffBracket", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;

                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }


            return rowCount > 0;
        }


        static public bool ModifyPlayoffBracket(PlayoffBracket p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayoffBracket", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@team1Id", SqlDbType.Int).Value = p.Team1Id;
                    myCommand.Parameters.Add("@team1IdType", SqlDbType.VarChar, 5).Value = p.Team1IdType;
                    myCommand.Parameters.Add("@team2Id", SqlDbType.Int).Value = p.Team2Id;
                    myCommand.Parameters.Add("@team2IdType", SqlDbType.VarChar, 5).Value = p.Team2IdType;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;
                    myCommand.Parameters.Add("@numGamesInSeries", SqlDbType.BigInt).Value = p.NumGamesInSeries;
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

        static public long AddPlayoffBracket(PlayoffBracket p)
        {
            long id = 0;

            if (p.PlayoffId == 0)
            {
                p.PlayoffId = Playoffs.GetCurrentPlayoff();
            }

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreatePlayoffBracket", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@team1Id", SqlDbType.Int).Value = p.Team1Id;
                    myCommand.Parameters.Add("@team1IdType", SqlDbType.VarChar, 5).Value = p.Team1IdType;
                    myCommand.Parameters.Add("@team2Id", SqlDbType.Int).Value = p.Team2Id;
                    myCommand.Parameters.Add("@team2IdType", SqlDbType.VarChar, 5).Value = p.Team2IdType;
                    myCommand.Parameters.Add("@gameNo", SqlDbType.Int).Value = p.GameNo;
                    myCommand.Parameters.Add("@roundNo", SqlDbType.Int).Value = p.RoundNo;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = p.PlayoffId;
                    myCommand.Parameters.Add("@numGamesInSeries", SqlDbType.BigInt).Value = p.NumGamesInSeries;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                        id = dr.GetInt64(0);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return id;
        }


        static public List<PlayoffGame> GetPlayoffGames(long bracketId)
        {
            List<PlayoffGame> playoffGames = new List<PlayoffGame>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffGames", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@bracketId", SqlDbType.BigInt).Value = bracketId;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                        playoffGames.Add(new PlayoffGame(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetDateTime(3), dr.GetDateTime(4), dr.GetInt64(5), dr.GetInt64(6),
                            dr.GetInt32(7), dr.GetBoolean(8)));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffGames;
        }

        static public PlayoffGame GetPlayoffGameFromGameNumber(long bracketId, int gameNo)
        {
            PlayoffGame playoffGame = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffGameFromGameNumber", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@bracketId", SqlDbType.BigInt).Value = bracketId;
                    myCommand.Parameters.Add("@gameNo", SqlDbType.Int).Value = gameNo;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffGame = new PlayoffGame(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetDateTime(3), dr.GetDateTime(4), dr.GetInt64(5), dr.GetInt64(6),
                            dr.GetInt32(7), dr.GetBoolean(8));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffGame;
        }

        static public PlayoffGame GetPlayoffGame(long id)
        {
            PlayoffGame playoffGame = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayoffGame", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                        playoffGame = new PlayoffGame(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetDateTime(3), dr.GetDateTime(4), dr.GetInt64(5), dr.GetInt64(6),
                            dr.GetInt32(7), dr.GetBoolean(8));
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playoffGame;
        }

        static public bool RemovePlayoffGame(PlayoffGame p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeletePlayoffGame", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;

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


        static public bool ModifyPlayoffGame(PlayoffGame p)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayoffGame", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = p.FieldId;
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = p.GameDate;
                    myCommand.Parameters.Add("@gameTime", SqlDbType.SmallDateTime).Value = p.GameTime;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = p.GameId;
                    myCommand.Parameters.Add("@team1HomeTeam", SqlDbType.Bit).Value = p.Team1HomeTeam;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = p.Id;
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

        static public long AddPlayoffGame(PlayoffGame p)
        {
            long id = 0;

            if (p.PlayoffId == 0)
            {
                p.PlayoffId = Playoffs.GetCurrentPlayoff();
            }

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreatePlayoffGame", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = p.FieldId;
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = p.GameDate;
                    myCommand.Parameters.Add("@gameTime", SqlDbType.SmallDateTime).Value = p.GameTime;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = p.GameId;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = p.PlayoffId;
                    myCommand.Parameters.Add("@team1HomeTeam", SqlDbType.Bit).Value = p.Team1HomeTeam;
                    myCommand.Parameters.Add("@seriesGameNo", SqlDbType.Int).Value = p.SeriesGameNo;
                    myCommand.Parameters.Add("@bracketId", SqlDbType.Int).Value = p.BracketId;
                    
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                        id = dr.GetInt64(0);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return id;
        }

        static public List<Team> GetPlayoffTeams(ModelObjects.PlayoffBracket pg, bool onlyRealTeams)
        {
            List<Team> t = new List<Team>(2);

            List<PlayoffSeed> seeds = DataAccess.Playoffs.GetPlayoffSeeds(pg.PlayoffId);

            t.Add(GetPlayoffTeam(seeds, pg.PlayoffId, pg.Team1IdType, pg.Team1Id, pg.RoundNo, pg.GameNo, -1, onlyRealTeams));

            t.Add(GetPlayoffTeam(seeds, pg.PlayoffId, pg.Team2IdType, pg.Team2Id, pg.RoundNo, pg.GameNo, 0, onlyRealTeams));

            return t;
        }

        static private Team GetPlayoffTeam(List<PlayoffSeed> seeds, long playoffId, string idType, long teamId, int roundNo, int gameNo, int modifier, bool onlyRealTeams)
        {
            Team t = null;

            if (idType == "SEED")
            {
                foreach (PlayoffSeed s in seeds)
                {
                    if (s.SeedNo == teamId)
                        t = DataAccess.Teams.GetTeam(s.TeamId);
                }

                if (t == null && !onlyRealTeams)
                {
                    t = new Team(0, 0, String.Format("Seed # {0}", teamId), 0, 0, 0);
                }

            }
            else if (idType == "GAME")
            {
                int bracketGameNo = gameNo * 2 + modifier;

                t = DataAccess.Playoffs.GetBracketWinner(playoffId, roundNo - 1, bracketGameNo);

                if (t == null && !onlyRealTeams)
                    t = new Team(0, 0, String.Format("Winner Round # {0} Bracket # {1}", roundNo - 1, bracketGameNo), 0, 0, 0);                  
            }

            return t;

        }

        static public bool SchedulePlayoffGame(long playoffGameId, long playoffId, Game game)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLeagueIdFromPlayoffSetup", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        game.LeagueId = dr.GetInt32(0);

                        dr.Close();

                        var newGame = Schedule.AddGame(game);
                        if (newGame.Id > 0)
                        {
                            myCommand = new SqlCommand("dbo.UpdatePlayoffGameId", myConnection);
                            myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                            myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = newGame.Id;
                            myCommand.Parameters.Add("@playoffId", SqlDbType.BigInt).Value = playoffGameId;
                            myCommand.Prepare();

                            rowCount = myCommand.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public Team GetBracketWinner(long playoffId, int roundNo, int gameNo)
        {
            Team team = null;

            PlayoffBracket playoffBracket = GetPlayoffBracket(playoffId, roundNo, gameNo);
            if (playoffBracket == null)
                return team;

            List<Team> teams = DataAccess.Playoffs.GetPlayoffTeams(playoffBracket, true);

            if (playoffBracket.Team1IdType == "BYE" || playoffBracket.Team2IdType == "BYE")
            {
                if (teams.Count > 1)
                {
                    if (playoffBracket.Team2IdType == "SEED")
                    {
                        team = teams[1];
                    }
                    else if (playoffBracket.Team1IdType == "SEED")
                    {
                        team = teams[0];
                    }
                }
            }
            else if (teams.Count == 2 && teams[0] != null && teams[1] != null)
            {
                List<PlayoffGame> games = GetPlayoffGames(playoffBracket.Id);

                int numRequiredWins = (playoffBracket.NumGamesInSeries / 2) + 1;
                int team1Wins = 0;
                int team2Wins = 0;

                foreach (PlayoffGame pg in games)
                {
                    Game g = DataAccess.Schedule.GetGame(pg.GameId);
                    if (g != null && g.GameWinner > 0)
                    {
                        if (g.GameWinner == teams[0].Id)
                            team1Wins++;
                        else if (g.GameWinner == teams[1].Id)
                            team2Wins++;
                    }
                }

                if (team1Wins == numRequiredWins)
                    team = teams[0];
                else if (team2Wins == numRequiredWins)
                    team = teams[1];
            }

            return team;
        }

        static public IEnumerable<Team> GetPossiblePlayoffTeams(long playoffId)
        {
            PlayoffSetup ps = DataAccess.Playoffs.GetPlayoffSetup(playoffId);
            if (ps != null)
                return DataAccess.Teams.GetTeams(ps.LeagueId);
            else
                return new List<Team>();
        }
    }
}
