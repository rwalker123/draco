using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;

namespace DataAccess
{

    /// <summary>
    /// Summary description for Schedule
    /// </summary>
    static public class Schedule
    {
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
                        LeagueName = DataAccess.Leagues.GetLeagueName(ls.LeagueId),
                        AwayPlayersPresent = DataAccess.Schedule.GetPlayerRecapGame(ls.Id, ls.VTeamId),
                        HomePlayersPresent = DataAccess.Schedule.GetPlayerRecapGame(ls.Id, ls.HTeamId)
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
                            FieldName = DataAccess.Fields.GetFieldName(sched.FieldId),
                            HasGameRecap = sched.GameRecaps.Any()
                        });
        }

        static public IQueryable<Game> GetCurrentSeasonSchedule(long accountId, DateTime startDate, DateTime endDate)
        {
            //SELECT LeagueSchedule.* 
            //FROM LeagueSchedule 
            //            LEFT JOIN LeagueSeason ON LeagueSchedule.LeagueId = LeagueSeason.Id
            //            LEFT JOIN League ON League.Id = LeagueSeason.LeagueId
            //WHERE League.AccountId = @accountId AND GameDate >= @startDate AND GameDate <= @endDate 
            //Order By GameDate, LeagueSchedule.LeagueId, GameTime

            DB db = DBConnection.GetContext();

            var currentSeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            var leaguesInSeason = (from ls in db.LeagueSeasons
                                   where ls.SeasonId == currentSeasonId
                                   select ls.Id);

            return (from sched in db.LeagueSchedules
                    where leaguesInSeason.Contains(sched.LeagueId) &&
                    sched.GameDate >= startDate && sched.GameDate <= endDate
                    orderby sched.GameDate
                    select new Game(sched.LeagueId, sched.Id, sched.GameDate, sched.HTeamId, sched.VTeamId, sched.HScore, sched.VScore,
                        sched.Comment, sched.FieldId, sched.GameStatus, sched.GameType, sched.Umpire1, sched.Umpire2, sched.Umpire3, sched.Umpire4)
                    {
                        HomeTeamName = DataAccess.Teams.GetTeamName(sched.HTeamId),
                        AwayTeamName = DataAccess.Teams.GetTeamName(sched.VTeamId),
                        FieldName = DataAccess.Fields.GetFieldName(sched.FieldId),
                        LeagueName = DataAccess.Leagues.GetLeagueName(sched.LeagueId),
                        HasGameRecap = sched.GameRecaps.Any()
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

        static public IQueryable<Game> GetTeamSchedule(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from sched in db.LeagueSchedules
                    where (sched.HTeamId == teamSeasonId || sched.VTeamId == teamSeasonId) 
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

        static public IQueryable<Game> GetTeamIncompleteGames(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from ls in db.LeagueSchedules
                    where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) &&
                    ls.GameStatus == 0
                    orderby ls.GameDate
                    select new Game(ls.LeagueId, ls.Id, ls.GameDate, ls.HTeamId, ls.VTeamId, ls.HScore, ls.VScore,
                        ls.Comment, ls.FieldId, ls.GameStatus, ls.GameType, ls.Umpire1, ls.Umpire2, ls.Umpire3, ls.Umpire4)
                    {
                        HomeTeamName = DataAccess.Teams.GetTeamName(ls.HTeamId),
                        AwayTeamName = DataAccess.Teams.GetTeamName(ls.VTeamId),
                        FieldName = DataAccess.Fields.GetFieldShortName(ls.FieldId)
                    });
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
            //SELECT count(PlayerId) FROM PlayerRecap WHERE GameId = @gameId AND PlayerId = @playerId
            DB db = DBConnection.GetContext();

            return (from pr in db.PlayerRecaps
                    where pr.GameId == gameId && pr.PlayerId == playerId
                    select pr).Any();
        }

        static public IQueryable<KeyValuePair<long, long>> GetPlayerRecapTeam(long teamId)
        {
            //SELECT PlayerId, count(*) as GP FROM PlayerRecap WHERE TeamId = @teamId Group By PlayerId

            DB db = DBConnection.GetContext();

            return (from pr in db.PlayerRecaps
                    where pr.TeamId == teamId
                    group pr by pr.PlayerId into prg
                    select new KeyValuePair<long, long>(prg.Key, prg.Count()));
        }

        static public IQueryable<long> GetPlayerRecapGame(long gameId, long teamId)
        {
            // SELECT PlayerId, count(*) as GP FROM PlayerRecap WHERE GameId = @gameId AND TeamId = @teamId Group By PlayerId

            DB db = DBConnection.GetContext();

            return (from pr in db.PlayerRecaps
                    where pr.GameId == gameId && pr.TeamId == teamId
                    select pr.PlayerId);
        }

        static public bool UpdateGameScore(Game game, bool emailResult)
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

            if (emailResult)
                SendGameResultEmail(game);

            return true;
        }

        private static int SendGameResultEmail(ModelObjects.Game g)
        {
            int numSent = 0;

            List<ModelObjects.Contact> contacts = new List<ModelObjects.Contact>();

            contacts.AddRange(DataAccess.Teams.GetTeamContacts(g.HomeTeamId));
            contacts.AddRange(DataAccess.Teams.GetTeamContacts(g.AwayTeamId));

            var umpires = DataAccess.Umpires.GetUmpiresFromGame(g);
            foreach (var umpire in umpires)
            {
                var u = DataAccess.Umpires.GetUmpire(umpire.Id);
                if (u != null)
                {
                    var c = DataAccess.Contacts.GetContact(u.ContactId);
                    if (c != null)
                        contacts.Add(c);
                }
            }

            IList<MailAddress> bccList = new List<MailAddress>();

            foreach (ModelObjects.Contact c in contacts)
            {
                try
                {
                    if (c.Email.Length > 0)
                        bccList.Add(new MailAddress(c.Email, c.FullNameFirst));
                }
                catch
                {
                }
            }

            if (bccList.Count != 0)
            {
                string homeTeam = DataAccess.Teams.GetTeamName(g.HomeTeamId);
                string awayTeam = DataAccess.Teams.GetTeamName(g.AwayTeamId);

                string from = Globals.GetCurrentUserId();
                if (String.IsNullOrEmpty(from))
                    return 0;

                var currentContact = DataAccess.Contacts.GetContact(from);
                if (currentContact == null)
                    return 0;

                string subject = "Game Status Notification: " + awayTeam + " @ " + homeTeam + ", " + g.GameDate.ToShortDateString() + " " + g.GameDate.ToShortTimeString();
                string message = "Your game: " + awayTeam + " @ " + homeTeam + ", " + g.GameDate.ToShortDateString() + " " + g.GameDate.ToShortTimeString() + " has been updated. The new status is: " + g.GameStatusLongText + ".";
                if (g.GameStatus == 1)
                {
                    message += Environment.NewLine + Environment.NewLine;

                    if (g.HomeScore > g.AwayScore)
                    {
                        message += homeTeam + " won the game " + g.HomeScore + " - " + g.AwayScore + ".";
                    }
                    else if (g.AwayScore > g.HomeScore)
                    {
                        message += awayTeam + " won the game " + g.AwayScore + " - " + g.HomeScore + ".";
                    }
                    else
                    {
                        message += " The game ended in a tie " + g.AwayScore + " - " + g.HomeScore + ".";
                    }
                }

                EmailUsersData data = new EmailUsersData()
                {
                    Message = message,
                     Subject = subject
                };

                IEnumerable<MailAddress> failedSends = Globals.MailMessage(new MailAddress(currentContact.Email, currentContact.FullNameFirst), bccList, data);
                numSent = bccList.Count - failedSends.Count();
            }

            return numSent;

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
