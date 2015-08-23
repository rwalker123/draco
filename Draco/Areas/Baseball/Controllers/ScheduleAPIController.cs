using AutoMapper;
using LinqToTwitter;
using Microsoft.ServiceBus.Notifications;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.Models.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class ScheduleAPIController : DBApiController
    {
        public ScheduleAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddGame(long accountId, long leagueSeasonId, GameViewModel g)
        {
            if (ModelState.IsValid)
            {
                var ls = Db.LeagueSeasons.Find(leagueSeasonId);
                if (ls == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (ls.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbGame = new Game()
                {
                    FieldId = g.FieldId,
                    Comment = String.Empty,
                    GameDate = g.GameDate,
                    HTeamId = g.HomeTeamId,
                    VTeamId = g.AwayTeamId,
                    HScore = g.HomeScore,
                    VScore = g.AwayScore,
                    LeagueId = leagueSeasonId,
                    GameStatus = g.GameStatus,
                    Umpire1 = g.Umpire1,
                    Umpire2 = g.Umpire2,
                    Umpire3 = g.Umpire3,
                    Umpire4 = g.Umpire4,
                    GameType = g.GameType
                };

                Db.LeagueSchedules.Add(dbGame);
                Db.SaveChanges();

                var vm = Mapper.Map<Game, GameViewModel>(dbGame);
                return Request.CreateResponse<GameViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGame(long accountId, long leagueSeasonId, GameViewModel g)
        {
            if (ModelState.IsValid)
            {
                var ls = Db.LeagueSeasons.Find(leagueSeasonId);
                if (ls == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (ls.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbGame = Db.LeagueSchedules.Find(g.Id);
                if (dbGame == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                dbGame.FieldId = g.FieldId;
                dbGame.Comment = String.Empty;
                dbGame.GameDate = g.GameDate;
                dbGame.HTeamId = g.HomeTeamId;
                dbGame.VTeamId = g.AwayTeamId;
                dbGame.HScore = g.HomeScore;
                dbGame.VScore = g.AwayScore;
                dbGame.GameStatus = g.GameStatus;
                dbGame.Umpire1 = g.Umpire1;
                dbGame.Umpire2 = g.Umpire2;
                dbGame.Umpire3 = g.Umpire3;
                dbGame.Umpire4 = g.Umpire4;
                dbGame.GameType = g.GameType;
                Db.SaveChanges();

                var vm = Mapper.Map<Game, GameViewModel>(dbGame);
                return Request.CreateResponse<GameViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("GameResult")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGameResults(long accountId, long leagueSeasonId, GameViewModel game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid)
            {
                var queryValues = Request.RequestUri.ParseQueryString();
                String strEmailResult = queryValues["emailResult"];
                bool emailResult = false;
                if (!String.IsNullOrEmpty(strEmailResult))
                {
                    bool.TryParse(strEmailResult, out emailResult);
                }

                var ls = Db.LeagueSeasons.Find(leagueSeasonId);
                if (ls == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (ls.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbGame = Db.LeagueSchedules.Find(game.Id);
                if (dbGame == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // forfeit requires different scores.
                if (game.GameStatus == 4)
                {
                    if (game.HomeScore == game.AwayScore)
                        return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Home Score and Away Score can't equal for a forfeit");
                }

                dbGame.GameStatus = game.GameStatus;
                dbGame.HScore = game.HomeScore;
                dbGame.VScore = game.AwayScore;
                dbGame.Comment = game.Comment ?? String.Empty;
                Db.SaveChanges();

                var playerRecapGame = Db.PlayerRecaps.Where(pr => pr.GameId == game.Id);
                Db.PlayerRecaps.RemoveRange(playerRecapGame);

                List<PlayerRecap> playersPresent = new List<PlayerRecap>();

                foreach (var playerId in game.HomePlayersPresent)
                {
                    playersPresent.Add(new PlayerRecap()
                    {
                        GameId = game.Id,
                        PlayerId = playerId,
                        TeamId = game.HomeTeamId,
                    });
                }

                foreach (var playerId in game.AwayPlayersPresent)
                {
                    playersPresent.Add(new PlayerRecap()
                    {
                        GameId = game.Id,
                        PlayerId = playerId,
                        TeamId = game.AwayTeamId,

                    });
                }

                Db.PlayerRecaps.AddRange(playersPresent);
                Db.SaveChanges();

                if (emailResult)
                    SendGameResultEmail(dbGame);

                if (game.GameStatus >= 1)
                {
                    // send out push notification
                    if (ConfigurationManager.AppSettings["AzureDeployed"] != null)
                    {
                        String notificationMessage = LeagueScheduleController.GetGameResultNotificationText(Db, dbGame);

                        var t = new TemplateNotification(new Dictionary<String, String>()
                        {
                            { "message", notificationMessage }
                        });
                        NotificationOutcome o = PushNotifications.Instance.Hub.SendNotificationAsync(t, "GameResults_" + accountId.ToString()).Result;

                        // samples of specific service calls, use template method above:
                        //var gcm = new GcmNotification("{\"data\":{\"message\":\"" + notificationMessage + "\"}}");
                        //NotificationOutcome o = PushNotifications.Instance.Hub.SendNotificationAsync(gcm).Result;

                        //var apple = new AppleNotification("{\"aps\":{\"alert\":\"" + notificationMessage + "\"}}");
                        //PushNotifications.Instance.Hub.SendAppleNativeNotification(apple);
                    }
                }

                var vm = Mapper.Map<Game, GameViewModel>(dbGame);
                return Request.CreateResponse<GameViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("tweetresult")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> TweetGameResult(long accountId, long leagueSeasonId, GameViewModel game)
        {
            if (ModelState.IsValid && game != null)
            {
                // if twitter keys then use them, if not return "Unauthorized" so that 
                // signin can begin and refresh page, etc.
                var a = Db.Accounts.Find(accountId);
                if (a == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var ls = Db.LeagueSeasons.Find(leagueSeasonId);
                if (ls == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (ls.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbGame = Db.LeagueSchedules.Find(game.Id);
                if (dbGame == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (String.IsNullOrEmpty(a.TwitterOauthSecretKey) || String.IsNullOrEmpty(a.TwitterOauthToken))
                    return Request.CreateResponse(HttpStatusCode.ExpectationFailed);

                String tweet = LeagueScheduleController.GetGameResultTweetText(Db, dbGame);
                if (String.IsNullOrEmpty(tweet))
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }

                var auth = new MvcAuthorizer
                {
                    CredentialStore = new InMemoryCredentialStore()
                    {
                        ConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"],
                        ConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"],
                        OAuthToken = a.TwitterOauthToken,
                        OAuthTokenSecret = a.TwitterOauthSecretKey
                    }
                };

                var ctx = new TwitterContext(auth);

                try
                {
                    Status responseTweet = await ctx.TweetAsync(tweet);
                    return Request.CreateResponse(HttpStatusCode.OK);
                }
                catch (TwitterQueryException ex)
                {
                    // if we get an authentication error, try to have the user log in.
                    if (ex.ErrorCode == 32)
                    {
                        return Request.CreateResponse(HttpStatusCode.ExpectationFailed);
                    }
                    else
                    {
                        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
                    }
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteGame(long accountId, long leagueSeasonId, long id)
        {
            var ls = Db.LeagueSeasons.Find(leagueSeasonId);
            if (ls == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ls.League.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var dbGame = Db.LeagueSchedules.Find(id);
            if (dbGame == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            Db.LeagueSchedules.Remove(dbGame);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetWeekGames(long accountId, long leagueSeasonId)
        {
            var ls = Db.LeagueSeasons.Find(leagueSeasonId);
            if (ls == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ls.League.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var queryValues = Request.RequestUri.ParseQueryString();
            String strStartDate = queryValues["startDay"];
            String strEndDate = queryValues["endDay"];
            if (!String.IsNullOrEmpty(strStartDate) &&
                !String.IsNullOrEmpty(strEndDate))
            {
                DateTime startDate = DateTime.Parse(strStartDate);
                DateTime endDate = DateTime.Parse(strEndDate);
                IQueryable<ModelObjects.Game> games;
                if (leagueSeasonId == 0)
                {
                    var currentSeasonId = this.GetCurrentSeasonId(accountId);
                    var leaguesInSeason = (from l in Db.LeagueSeasons
                                           where l.SeasonId == currentSeasonId
                                           select l.Id);

                    games = (from sched in Db.LeagueSchedules
                             where leaguesInSeason.Contains(sched.LeagueId) &&
                             sched.GameDate >= startDate && sched.GameDate <= endDate
                             orderby sched.GameDate
                             select sched);
                }
                else
                {
                    games = (from sched in Db.LeagueSchedules
                             where sched.LeagueId == leagueSeasonId &&
                             sched.GameDate >= startDate && sched.GameDate <= endDate
                             orderby sched.GameDate
                             select sched);
                }

                var vm = Mapper.Map<IEnumerable<Game>, GameViewModel[]>(games);
                return Request.CreateResponse<GameViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetTeamWeekGames(long accountId, long teamSeasonId)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var queryValues = Request.RequestUri.ParseQueryString();
            String strStartDate = queryValues["startDay"];
            String strEndDate = queryValues["endDay"];
            if (!String.IsNullOrEmpty(strStartDate) &&
                !String.IsNullOrEmpty(strEndDate))
            {
                DateTime startDate = DateTime.Parse(strStartDate);
                DateTime endDate = DateTime.Parse(strEndDate);
                var games = (from sched in Db.LeagueSchedules
                             where (sched.HTeamId == teamSeasonId || sched.VTeamId == teamSeasonId) &&
                             sched.GameDate >= startDate && sched.GameDate <= endDate
                             orderby sched.GameDate
                             select sched);

                var vm = Mapper.Map<IEnumerable<Game>, GameViewModel[]>(games);
                return Request.CreateResponse<GameViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        private int SendGameResultEmail(Game g)
        {
            int numSent = 0;

            var contacts = (from ts in Db.TeamsSeasons
                            join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                            join r in Db.Rosters on rs.PlayerId equals r.Id
                            join c in Db.Contacts on r.ContactId equals c.Id
                            where !String.IsNullOrEmpty(c.Email) && (ts.Id == g.HTeamId || ts.Id == g.VTeamId) && !rs.Inactive
                            orderby c.LastName, c.FirstName, c.MiddleName
                            select c).ToList();

            var u = Db.LeagueUmpires.Find(g.Umpire1);
            if (u != null)
                contacts.Add(u.Contact);

            u = Db.LeagueUmpires.Find(g.Umpire2);
            if (u != null)
                contacts.Add(u.Contact);

            u = Db.LeagueUmpires.Find(g.Umpire3);
            if (u != null)
                contacts.Add(u.Contact);

            u = Db.LeagueUmpires.Find(g.Umpire4);
            if (u != null)
                contacts.Add(u.Contact);

            IList<MailAddress> bccList = new List<MailAddress>();

            foreach (Contact c in contacts)
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
                string homeTeam = Db.TeamsSeasons.Find(g.HTeamId)?.Name;
                string awayTeam = Db.TeamsSeasons.Find(g.VTeamId)?.Name;

                var currentContact = this.GetCurrentContact();
                if (currentContact == null)
                    return 0;

                string subject = "Game Status Notification: " + awayTeam + " @ " + homeTeam + ", " + g.GameDate.ToShortDateString() + " " + g.GameDate.ToShortTimeString();
                string message = "Your game: " + awayTeam + " @ " + homeTeam + ", " + g.GameDate.ToShortDateString() + " " + g.GameDate.ToShortTimeString() + " has been updated. The new status is: " + g.GameStatusLongText + ".";
                if (g.GameStatus == 1)
                {
                    message += Environment.NewLine + Environment.NewLine;

                    if (g.HScore > g.VScore)
                    {
                        message += homeTeam + " won the game " + g.HScore + " - " + g.VScore + ".";
                    }
                    else if (g.VScore > g.HScore)
                    {
                        message += awayTeam + " won the game " + g.VScore + " - " + g.HScore + ".";
                    }
                    else
                    {
                        message += " The game ended in a tie " + g.VScore + " - " + g.HScore + ".";
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

    }
}
