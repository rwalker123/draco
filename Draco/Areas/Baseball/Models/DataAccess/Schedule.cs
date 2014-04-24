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
            return new Game(dr.GetInt64(9), dr.GetInt64(0), dr.GetDateTime(1),
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
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSchedules
                    where ls.Id == gameId
                    select new Game()
                    {
                        Id = ls.Id,
                        AwayScore = ls.VScore,
                        AwayTeamId = ls.VTeamId,
                        Comment = ls.Comment,
                        FieldId = ls.FieldId,
                        GameDate = ls.GameDate,
                        GameStatus = ls.GameStatus,
                        GameType = ls.GameType,
                        HomeScore = ls.HScore,
                        HomeTeamId = ls.HTeamId,
                        LeagueId = ls.LeagueId,
                        Umpire1 = ls.Umpire1,
                        Umpire2 = ls.Umpire2,
                        Umpire3 = ls.Umpire3,
                        Umpire4 = ls.Umpire4,
                        HasGameRecap = ls.GameRecaps.Any(),
                        FieldName  = DataAccess.Fields.GetFieldShortName(ls.FieldId),
                        HomeTeamName = DataAccess.Teams.GetTeamName(ls.HTeamId),
                        AwayTeamName = DataAccess.Teams.GetTeamName(ls.VTeamId),
                        LeagueName = DataAccess.Leagues.GetLeagueName(ls.LeagueId)
                    }).SingleOrDefault();

        }

        static public IQueryable<Game> GetGames(long accountId)
        {
            DB db = DBConnection.GetContext();

            long curSeason = DataAccess.Seasons.GetCurrentSeason(accountId);

            return (from ls in db.LeagueSchedules
                    join l in db.LeagueSeasons on ls.LeagueId equals l.Id
                    join s in db.Seasons on l.SeasonId equals s.Id
                    where s.Id == curSeason
                    select new Game()
                    {
                        Id = ls.Id,
                        AwayScore = ls.VScore,
                        AwayTeamId = ls.VTeamId,
                        Comment = ls.Comment,
                        FieldId = ls.FieldId,
                        GameDate = ls.GameDate,
                        GameStatus = ls.GameStatus,
                        GameType = ls.GameType,
                        HomeScore = ls.HScore,
                        HomeTeamId = ls.HTeamId,
                        LeagueId = ls.LeagueId,
                        Umpire1 = ls.Umpire1,
                        Umpire2 = ls.Umpire2,
                        Umpire3 = ls.Umpire3,
                        Umpire4 = ls.Umpire4,
                        HasGameRecap = ls.GameRecaps.Any(),
                        FieldName = DataAccess.Fields.GetFieldShortName(ls.FieldId),
                        HomeTeamName = DataAccess.Teams.GetTeamName(ls.HTeamId),
                        AwayTeamName = DataAccess.Teams.GetTeamName(ls.VTeamId),
                        LeagueName = DataAccess.Leagues.GetLeagueName(ls.LeagueId)
                    });

        }

        static public IQueryable<Game> GetSchedule(long leagueSeasonId, DateTime startDate, DateTime endDate)
        {
            //SELECT LeagueSchedule.* 
            //FROM LeagueSchedule 
            //            LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
            //            LEFT JOIN League ON League.Id = LeagueSeason.LeagueId
            //WHERE League.AccountId = @accountId AND GameDate >= @startDate AND GameDate <= @endDate 
            //Order By GameDate, LeagueSchedule.LeagueId, GameTime

            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    where sched.LeagueId == leagueSeasonId && 
                    sched.GameDate >= startDate && sched.GameDate <= endDate
                    orderby sched.GameDate
                    select new Game(sched.LeagueId, sched.Id, sched.GameDate, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
                        sched.Comment, sched.FieldId, sched.GameStatus, sched.GameType, sched.Umpire1, sched.Umpire2, sched.Umpire3, sched.Umpire4)
                        {
                            HomeTeamName = DataAccess.Teams.GetTeamName(sched.HTeamId),
                            AwayTeamName = DataAccess.Teams.GetTeamName(sched.VTeamId),
                            FieldName = DataAccess.Fields.GetFieldName(sched.FieldId)
                        });
        }


        static public IQueryable<Game> GetTeamSchedule(long teamSeasonId, DateTime startDate, DateTime endDate)
        {
            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    where (sched.HTeamId == teamSeasonId || sched.VTeamId == teamSeasonId) &&
                    sched.GameDate >= startDate && sched.GameDate <= endDate
                    orderby sched.GameDate
                    select new Game(sched.LeagueId, sched.Id, sched.GameDate, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
                        sched.Comment, sched.FieldId, sched.GameStatus, sched.GameType, sched.Umpire1, sched.Umpire2, sched.Umpire3, sched.Umpire4)
                    {
                        HomeTeamName = DataAccess.Teams.GetTeamName(sched.HTeamId),
                        AwayTeamName = DataAccess.Teams.GetTeamName(sched.VTeamId),
                        FieldName = DataAccess.Fields.GetFieldName(sched.FieldId)
                    });
        }

        static public IQueryable<Game> GetCompletedGames(long leagueId)
        {
            DB db = DBConnection.GetContext();
            return (from ls in db.LeagueSchedules
                    where ls.LeagueId == leagueId &&
                    (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                    orderby ls.GameDate
                    select new Game(ls.LeagueId, ls.Id, ls.GameDate, ls.HTeamId, ls.VTeamId, ls.HScore, ls.VScore,
                        ls.Comment, ls.FieldId, ls.GameStatus, ls.GameType, ls.Umpire1, ls.Umpire2, ls.Umpire3, ls.Umpire4));
        }

        static public IQueryable<Game> GetTeamCompletedGames(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSchedules
                    where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) &&
                    (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                    orderby ls.GameDate
                    select new Game(ls.LeagueId, ls.Id, ls.GameDate, ls.HTeamId, ls.VTeamId, ls.HScore, ls.VScore,
                        ls.Comment, ls.FieldId, ls.GameStatus, ls.GameType, ls.Umpire1, ls.Umpire2, ls.Umpire3, ls.Umpire4) 
                        {
                            HomeTeamName = DataAccess.Teams.GetTeamName(ls.HTeamId),
                            AwayTeamName = DataAccess.Teams.GetTeamName(ls.VTeamId)
                        });
        }

        static public IQueryable<Game> GetScoreboard(long accountId, DateTime when)
        {
            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    join seas in db.LeagueSeasons on sched.LeagueId equals seas.Id
                    join leag in db.Leagues on seas.LeagueId equals leag.Id
                    where leag.AccountId == accountId && sched.GameDate.Date.Equals(when.Date)
                    orderby sched.GameDate
                    select new Game(sched.LeagueId, sched.Id, sched.GameDate, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
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

        static public bool UpdateGameScore(Game game)
        {
            DB db = DBConnection.GetContext();

            // forfeit requires different scores.
            if (game.GameStatus == 4)
            {
                if (game.HomeScore == game.AwayScore)
                    return false;
            }

            var dbGame = (from ls in db.LeagueSchedules
                          where ls.Id == game.Id
                          select ls).SingleOrDefault();
            if (dbGame == null)
                return false;

            dbGame.GameStatus = game.GameStatus;
            dbGame.HScore = game.HomeScore;
            dbGame.VScore = game.AwayScore;
            dbGame.Comment = game.Comment ?? String.Empty;
            db.SubmitChanges();

            var playerRecapGame = (from p in db.PlayerRecaps
                                   where p.GameId == game.Id
                                   select p);
            db.PlayerRecaps.DeleteAllOnSubmit(playerRecapGame);

            List<SportsManager.Model.PlayerRecap> playersPresent = new List<SportsManager.Model.PlayerRecap>();
            
            foreach(var playerId in game.HomePlayersPresent)
            {
                playersPresent.Add(new SportsManager.Model.PlayerRecap()
                    {
                        GameId = game.Id,
                        PlayerId = playerId,
                        TeamId = game.HomeTeamId,

                    });
            }

            foreach (var playerId in game.AwayPlayersPresent)
            {
                playersPresent.Add(new SportsManager.Model.PlayerRecap()
                {
                    GameId = game.Id,
                    PlayerId = playerId,
                    TeamId = game.AwayTeamId,

                });
            }

            db.PlayerRecaps.InsertAllOnSubmit(playersPresent);
            db.SubmitChanges();

            return true;
        }

        static public bool ModifyGame(Game g)
        {
            DB db = DBConnection.GetContext();

            var dbGame = (from ls in db.LeagueSchedules
                          where ls.Id == g.Id
                          select ls).SingleOrDefault();

            if (dbGame == null)
                return false;

            dbGame.Id = g.Id;
            dbGame.FieldId = g.FieldId;
            dbGame.Comment = String.Empty;
            dbGame.GameDate = g.GameDate;
            dbGame.HTeamId = g.HomeTeamId;
            dbGame.VTeamId = g.AwayTeamId;
            dbGame.HScore = g.HomeScore;
            dbGame.VScore = g.AwayScore;
            dbGame.LeagueId = g.LeagueId;
            dbGame.GameStatus = g.GameStatus;
            dbGame.Umpire1 = g.Umpire1;
            dbGame.Umpire2 = g.Umpire2;
            dbGame.Umpire3 = g.Umpire3;
            dbGame.Umpire4 = g.Umpire4;
            dbGame.GameType = g.GameType;

            db.SubmitChanges();

            g.HomeTeamName = DataAccess.Teams.GetTeamName(g.HomeTeamId);
            g.AwayTeamName = DataAccess.Teams.GetTeamName(g.AwayTeamId);
            g.FieldName = DataAccess.Fields.GetFieldName(g.FieldId);

            return true;
        }

        static public ModelObjects.Game AddGame(Game g)
        {
            DB db = DBConnection.GetContext();

            var dbGame = new SportsManager.Model.LeagueSchedule()
            {
                FieldId = g.FieldId,
                Comment = String.Empty,
                GameDate = g.GameDate,
                HTeamId = g.HomeTeamId,
                VTeamId = g.AwayTeamId,
                HScore = g.HomeScore,
                VScore = g.AwayScore,
                LeagueId = g.LeagueId,
                GameStatus = g.GameStatus,
                Umpire1 = g.Umpire1,
                Umpire2 = g.Umpire2,
                Umpire3 = g.Umpire3,
                Umpire4 = g.Umpire4,
                GameType = g.GameType
            };

            db.LeagueSchedules.InsertOnSubmit(dbGame);
            db.SubmitChanges();

            g.Id = dbGame.Id;
            g.HomeTeamName = DataAccess.Teams.GetTeamName(g.HomeTeamId);
            g.AwayTeamName = DataAccess.Teams.GetTeamName(g.AwayTeamId);
            g.FieldName = DataAccess.Fields.GetFieldName(g.FieldId);

            return g;
        }

        static public bool RemoveGame(long gameId)
        {
            DB db = DBConnection.GetContext();

            var dbGame = (from ls in db.LeagueSchedules
                          where ls.Id == gameId
                          select ls).SingleOrDefault();
            
            if (dbGame == null)
                return false;

            db.LeagueSchedules.DeleteOnSubmit(dbGame);
            db.SubmitChanges();

            return true;
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
