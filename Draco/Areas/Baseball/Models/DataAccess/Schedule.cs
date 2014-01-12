using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.UI.WebControls;
using ModelObjects;
using SportsManager;

namespace DataAccess
{

    /// <summary>
    /// Summary description for Schedule
    /// </summary>
    static public class Schedule
    {
        static Game CreateGame(SqlDataReader dr)
        {
            return new Game(dr.GetInt64(9), dr.GetInt64(0), dr.GetDateTime(1), dr.GetDateTime(2),
                dr.GetInt64(3), dr.GetInt64(4), dr.GetInt32(5), dr.GetInt32(6),
                dr.GetString(7), dr.GetInt64(8), dr.GetInt32(10), dr.GetInt64(11),
                dr.GetInt64(12), dr.GetInt64(13), dr.GetInt64(14), dr.GetInt64(15));
        }

        static public IEnumerable<ListItem> GetGameTypes()
        {
            List<ListItem> li = new List<ListItem>();

            li.Add(new ListItem("Regular", "0"));
            li.Add(new ListItem("Playoff", "1"));

            return li;
        }

        static public IEnumerable<ListItem> GetGameStatusTypes()
        {
            List<ListItem> li = new List<ListItem>();

            li.Add(new ListItem("Incomplete", "0"));
            li.Add(new ListItem("Final", "1"));
            li.Add(new ListItem("Rainout", "2"));
            li.Add(new ListItem("Postponed", "3"));
            li.Add(new ListItem("Forfeit", "4"));
            li.Add(new ListItem("Did not report", "5"));

            return li;
        }

        static public string GetGameStatusName(int gameStatus)
        {
            string gameStatusString = String.Empty;

            switch (gameStatus)
            {
                case 0:
                    gameStatusString = "Incomplete";
                    break;
                case 1:
                    gameStatusString = "Final";
                    break;
                case 2:
                    gameStatusString = "Rainout";
                    break;
                case 3:
                    gameStatusString = "Postponed";
                    break;
                case 4:
                    gameStatusString = "Forfeit";
                    break;
                case 5:
                    gameStatusString = "Did not report";
                    break;
            }

            return gameStatusString;
        }

        static public Game GetGame(long gameId)
        {
            Game g = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetGame", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        g = CreateGame(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return g;
        }

        static public List<Game> GetSchedule(long leagueId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetSchedule", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetSchedule(long leagueId, int month)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetScheduleMonth", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@month", SqlDbType.Int).Value = month;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public IEnumerable<Game> GetSchedule(long leagueSeasonId, DateTime curDate)
        {
            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    join seas in db.LeagueSeasons on sched.LeagueId equals seas.id
                    where seas.id == leagueSeasonId && sched.GameDate.Date.Equals(curDate.Date)
                    orderby sched.GameDate, sched.GameTime
                    select new Game(sched.LeagueId, sched.id, sched.GameDate, sched.GameTime, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
                        sched.Comment, sched.FieldId, sched.GameStatus, sched.GameType, sched.Umpire1, sched.Umpire2, sched.Umpire3, sched.Umpire4));
        }


        static public List<Game> GetTeamSchedule(long leagueId, long teamId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamSchedule", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetTeamSchedule(long teamId, int month)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamScheduleMonth", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@month", SqlDbType.Int).Value = month;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetCompletedGames(long leagueId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetCompletedGames", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetTeamCompletedGames(long leagueId, long teamId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamCompletedGames", myConnection);
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = leagueId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetTeamRecentGames(long teamId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamRecentGames", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public List<Game> GetTeamUpcomingGames(long teamId)
        {
            List<Game> schedule = new List<Game>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamUpcomingGames", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        static public IQueryable<Game> GetScoreboard(long accountId, DateTime when)
        {
            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    join seas in db.LeagueSeasons on sched.LeagueId equals seas.id
                    join leag in db.Leagues on seas.LeagueId equals leag.id
                    where leag.AccountId == accountId && sched.GameDate.Date.Equals(when.Date)
                    orderby sched.GameDate, sched.GameTime
                    select new Game(sched.LeagueId, sched.id, sched.GameDate, sched.GameTime, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
                        sched.Comment, sched.FieldId, sched.GameStatus, sched.GameType, sched.Umpire1, sched.Umpire2, sched.Umpire3, sched.Umpire4));
        }

        static public bool PlayerHasRecap(long gameId, long playerId)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.PlayerHasRecap", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                        rowCount = dr.GetInt32(0);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount <= 0) ? false : true;
        }

        static public Hashtable GetPlayerRecapTeam(long teamId)
        {
            Hashtable playerRecap = new Hashtable();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayerRecapTeam", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        playerRecap.Add(dr.GetInt64(0), dr.GetInt64(1));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playerRecap;
        }

        static public Hashtable GetPlayerRecapGame(long gameId, long teamId)
        {
            Hashtable playerRecap = new Hashtable();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetPlayerRecapGame", myConnection);
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        playerRecap.Add(dr.GetInt64(0), dr.GetInt64(1));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return playerRecap;
        }

        static public bool UpdateGameScore(Game game, long[] homePlayersPlayed, long[] awayPlayersPlayed)
        {
            long gameId = game.Id;
            int hScore = game.HomeScore;
            int vScore = game.AwayScore;
            string comment = game.Comment;
            int gameStatus = game.GameStatus;

            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateGameScore", myConnection);
                    myCommand.Parameters.Add("@hScore", SqlDbType.Int).Value = hScore;
                    myCommand.Parameters.Add("@vScore", SqlDbType.Int).Value = vScore;
                    myCommand.Parameters.Add("@comment", SqlDbType.VarChar, 255).Value = comment;
                    myCommand.Parameters.Add("@gameStatus", SqlDbType.Int).Value = gameStatus;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = gameId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();

                    if (rowCount > 0)
                    {
                        // update players played.
                        // first remove all players played, then add new ones.
                        myCommand = new SqlCommand("dbo.DeletePlayerRecapGame", myConnection);
                        myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                        myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                        myCommand.Prepare();

                        myCommand.ExecuteNonQuery();

                        myCommand = new SqlCommand("dbo.CreatePlayerRecap", myConnection);
                        myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                        myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = gameId;
                        SqlParameter teamParam = myCommand.Parameters.Add("@teamId", SqlDbType.BigInt);
                        SqlParameter playerParam = myCommand.Parameters.Add("@playerId", SqlDbType.BigInt);

                        if (homePlayersPlayed != null)
                        {
                            teamParam.Value = game.HomeTeamId;

                            foreach (long playerId in homePlayersPlayed)
                            {
                                playerParam.Value = playerId;
                                myCommand.Prepare();
                                myCommand.ExecuteNonQuery();
                            }
                        }

                        if (awayPlayersPlayed != null)
                        {
                            teamParam.Value = game.AwayTeamId;

                            foreach (long playerId in awayPlayersPlayed)
                            {
                                playerParam.Value = playerId;
                                myCommand.Prepare();
                                myCommand.ExecuteNonQuery();
                            }
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

        static public bool ModifyGame(Game g)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateGame", myConnection);
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = g.GameDate;
                    myCommand.Parameters.Add("@gameTime", SqlDbType.SmallDateTime).Value = g.GameTime;
                    myCommand.Parameters.Add("@hTeamId", SqlDbType.BigInt).Value = g.HomeTeamId;
                    myCommand.Parameters.Add("@vTeamId", SqlDbType.BigInt).Value = g.AwayTeamId;
                    myCommand.Parameters.Add("@hScore", SqlDbType.Int).Value = g.HomeScore;
                    myCommand.Parameters.Add("@vScore", SqlDbType.Int).Value = g.AwayScore;
                    myCommand.Parameters.Add("@comment", SqlDbType.VarChar, 255).Value = g.Comment;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = g.FieldId;
                    myCommand.Parameters.Add("@gameStatus", SqlDbType.Int).Value = g.GameStatus;
                    myCommand.Parameters.Add("@gameType", SqlDbType.BigInt).Value = g.GameType;
                    myCommand.Parameters.Add("@gameId", SqlDbType.BigInt).Value = g.Id;
                    myCommand.Parameters.Add("@umpire1", SqlDbType.BigInt).Value = g.Umpire1;
                    myCommand.Parameters.Add("@umpire2", SqlDbType.BigInt).Value = g.Umpire2;
                    myCommand.Parameters.Add("@umpire3", SqlDbType.BigInt).Value = g.Umpire3;
                    myCommand.Parameters.Add("@umpire4", SqlDbType.BigInt).Value = g.Umpire4;

                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return (rowCount <= 0) ? false : true;
        }

        static public bool AddGame(Game g)
        {
            if (g.LeagueId <= 0)
                g.LeagueId = Leagues.GetCurrentLeague();

            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateGame", myConnection);
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = g.GameDate;
                    myCommand.Parameters.Add("@gameTime", SqlDbType.SmallDateTime).Value = g.GameTime;
                    myCommand.Parameters.Add("@hTeamId", SqlDbType.BigInt).Value = g.HomeTeamId;
                    myCommand.Parameters.Add("@vTeamId", SqlDbType.BigInt).Value = g.AwayTeamId;
                    myCommand.Parameters.Add("@hScore", SqlDbType.Int).Value = g.HomeScore;
                    myCommand.Parameters.Add("@vScore", SqlDbType.Int).Value = g.AwayScore;
                    myCommand.Parameters.Add("@comment", SqlDbType.VarChar, 255).Value = g.Comment;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = g.FieldId;
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = g.LeagueId;
                    myCommand.Parameters.Add("@gameStatus", SqlDbType.Int).Value = g.GameStatus;
                    myCommand.Parameters.Add("@gameType", SqlDbType.BigInt).Value = g.GameType;
                    myCommand.Parameters.Add("@umpire1", SqlDbType.BigInt).Value = g.Umpire1;
                    myCommand.Parameters.Add("@umpire2", SqlDbType.BigInt).Value = g.Umpire2;
                    myCommand.Parameters.Add("@umpire3", SqlDbType.BigInt).Value = g.Umpire3;
                    myCommand.Parameters.Add("@umpire4", SqlDbType.BigInt).Value = g.Umpire4;
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

            return (rowCount <= 0) ? false : true;
        }

        static public long AddGameGiveId(Game g)
        {
            if (g.LeagueId <= 0)
                g.LeagueId = Leagues.GetCurrentLeague();

            long gameId = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateGameGiveId", myConnection);
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = g.GameDate;
                    myCommand.Parameters.Add("@gameTime", SqlDbType.SmallDateTime).Value = g.GameTime;
                    myCommand.Parameters.Add("@hTeamId", SqlDbType.BigInt).Value = g.HomeTeamId;
                    myCommand.Parameters.Add("@vTeamId", SqlDbType.BigInt).Value = g.AwayTeamId;
                    myCommand.Parameters.Add("@hScore", SqlDbType.Int).Value = g.HomeScore;
                    myCommand.Parameters.Add("@vScore", SqlDbType.Int).Value = g.AwayScore;
                    myCommand.Parameters.Add("@comment", SqlDbType.VarChar, 255).Value = g.Comment;
                    myCommand.Parameters.Add("@fieldId", SqlDbType.BigInt).Value = g.FieldId;
                    myCommand.Parameters.Add("@leagueId", SqlDbType.BigInt).Value = g.LeagueId;
                    myCommand.Parameters.Add("@gameStatus", SqlDbType.Int).Value = g.GameStatus;
                    myCommand.Parameters.Add("@gameType", SqlDbType.BigInt).Value = g.GameType;
                    myCommand.Parameters.Add("@umpire1", SqlDbType.BigInt).Value = g.Umpire1;
                    myCommand.Parameters.Add("@umpire2", SqlDbType.BigInt).Value = g.Umpire2;
                    myCommand.Parameters.Add("@umpire3", SqlDbType.BigInt).Value = g.Umpire3;
                    myCommand.Parameters.Add("@umpire4", SqlDbType.BigInt).Value = g.Umpire4;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        gameId = dr.GetInt64(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return gameId;
        }

        static public bool RemoveGame(Game game)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteGame", myConnection);
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = game.Id;
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

            return (rowCount <= 0) ? false : true;
        }

        static public List<Game> FindGame(Team homeTeam, Team awayTeam, string gameDateString, string gameTimeString)
        {
            List<Game> schedule = new List<Game>();

            DateTime gameDate;
            DateTime gameTime;

            try
            {
                gameDate = DateTime.Parse(gameDateString);
                gameTime = DateTime.Parse(gameTimeString);
            }
            catch (FormatException)
            {
                return schedule;
            }

            try
            {
                TimeSpan ts = new TimeSpan(0, 30, 0);

                DateTime gameBeginTime = gameTime.Subtract(ts);
                DateTime gameEndTime = gameTime.Add(ts);

                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.FindGame", myConnection);
                    myCommand.Parameters.Add("@homeTeamId", SqlDbType.BigInt).Value = homeTeam.Id;
                    myCommand.Parameters.Add("@awayTeamId", SqlDbType.BigInt).Value = awayTeam.Id;
                    myCommand.Parameters.Add("@gameDate", SqlDbType.SmallDateTime).Value = gameDate;
                    myCommand.Parameters.Add("@gameBeginTime", SqlDbType.SmallDateTime).Value = gameBeginTime;
                    myCommand.Parameters.Add("@gameEndTime", SqlDbType.SmallDateTime).Value = gameEndTime;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        schedule.Add(CreateGame(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return schedule;
        }

        public static List<ScheduleByDayOfMonth> GetScheduleByDayOfMonth(long leagueId, int month, int year, bool includeEmptyDays)
        {
            List<ScheduleByDayOfMonth> schedule = new List<ScheduleByDayOfMonth>();

            SortedList<DateTime, List<object>> schedByDate = new SortedList<DateTime, List<object>>();

            int maxDays = DateTime.DaysInMonth(year, month);

            if (includeEmptyDays)
            {
                for (int i = 1; i <= maxDays; ++i)
                {
                    schedByDate.Add(new DateTime(year, month, i), new List<object>());
                }
            }

            List<ModelObjects.LeagueEvent> events = DataAccess.LeagueEvents.GetEvents(leagueId, month);
            foreach (ModelObjects.LeagueEvent e in events)
            {
                List<object> l = null;

                if (schedByDate.ContainsKey(e.EventDate))
                {
                    l = schedByDate[e.EventDate];
                }
                else
                {
                    l = new List<object>();
                    schedByDate.Add(e.EventDate, l);
                }

                l.Add(e);
            }


            List<ModelObjects.Game> games = DataAccess.Schedule.GetSchedule(leagueId, month);
            foreach (ModelObjects.Game g in games)
            {
                List<object> l = null;

                if (schedByDate.ContainsKey(g.GameDate))
                {
                    l = schedByDate[g.GameDate];
                }
                else
                {
                    l = new List<object>();
                    schedByDate.Add(g.GameDate, l);
                }

                l.Add(g);
            }

            DateTime prevDate = DateTime.MinValue;
            ScheduleByDayOfMonth curSchedule = new ScheduleByDayOfMonth(DateTime.Now);

            foreach (KeyValuePair<DateTime, List<object>> kvp in schedByDate)
            {
                DateTime d = kvp.Key;

                if (prevDate != d)
                {
                    curSchedule = new ScheduleByDayOfMonth(d);
                    schedule.Add(curSchedule);

                    prevDate = d;
                }

                foreach (object o in kvp.Value)
                {
                    if (o is LeagueEvent)
                    {
                        curSchedule.AddEvent((LeagueEvent)o);
                    }
                    else
                    {
                        curSchedule.AddGame((Game)o);
                    }
                }
            }

            return schedule;
        }


        public static List<Player> GetPlayersFromGame(long gameId)
        {
            Game g = GetGame(gameId);

            List<Player> players = new List<Player>();

            if (g != null)
            {
                players.AddRange(DataAccess.TeamRoster.GetPlayers(g.HomeTeamId));
                players.AddRange(DataAccess.TeamRoster.GetPlayers(g.AwayTeamId));
            }

            players.Sort();

            return players;
        }
    }
}
