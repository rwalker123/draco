using LinqToTwitter;
using Microsoft.ServiceBus.Notifications;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class ScheduleAPIController : ApiController
    {

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddGame(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                var newGame = DataAccess.Schedule.AddGame(game);
                if (newGame != null && newGame.Id > 0)
                {
                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.Created, newGame);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGame(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                bool found = DataAccess.Schedule.ModifyGame(game);
                if (found)
                {
                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.OK, game);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("GameResult")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGameResults(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                var queryValues = Request.RequestUri.ParseQueryString();
                String strEmailResult = queryValues["emailResult"];
                bool emailResult = false;
                if (!String.IsNullOrEmpty(strEmailResult))
                {
                    bool.TryParse(strEmailResult, out emailResult);
                }

                bool found = DataAccess.Schedule.UpdateGameScore(game, emailResult);
                if (found)
                {
                    if (game.GameStatus >= 1)
                    {
                        // send out push notification
                        if (ConfigurationManager.AppSettings["AzureDeployed"] != null)
                        {
                            String notificationMessage = LeagueScheduleController.GetGameResultNotificationText(game);

                            var t = new TemplateNotification(new Dictionary<String, String>()
                            {
                                { "message", notificationMessage }
                            });
                            NotificationOutcome o = PushNotifications.Instance.Hub.SendNotificationAsync(t).Result;

                            // samples of specific service calls, use template method above:
                            //var gcm = new GcmNotification("{\"data\":{\"message\":\"" + notificationMessage + "\"}}");
                            //NotificationOutcome o = PushNotifications.Instance.Hub.SendNotificationAsync(gcm).Result;

                            //var apple = new AppleNotification("{\"aps\":{\"alert\":\"" + notificationMessage + "\"}}");
                            //PushNotifications.Instance.Hub.SendAppleNativeNotification(apple);
                        }
                    }

                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.OK, game);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("tweetresult")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> TweetGameResult(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                // if twitter keys then use them, if not return "Unauthorized" so that 
                // signin can begin and refresh page, etc.
                var a = DataAccess.SocialIntegration.Twitter.GetAccountTwitterData(accountId);
                if (a == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (String.IsNullOrEmpty(a.TwitterOauthSecretKey) || String.IsNullOrEmpty(a.TwitterOauthToken))
                    return Request.CreateResponse(HttpStatusCode.ExpectationFailed);

                String tweet = LeagueScheduleController.GetGameResultTweetText(game);
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
            bool found = DataAccess.Schedule.RemoveGame(id);
            if (found)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetWeekGames(long accountId, long leagueSeasonId)
        {
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
                    games = DataAccess.Schedule.GetCurrentSeasonSchedule(accountId, startDate, endDate);
                else
                    games = DataAccess.Schedule.GetSchedule(leagueSeasonId, startDate, endDate);

                return Request.CreateResponse<IQueryable<ModelObjects.Game>>(HttpStatusCode.OK, games);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetTeamWeekGames(long accountId, long teamSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            String strStartDate = queryValues["startDay"];
            String strEndDate = queryValues["endDay"];
            if (!String.IsNullOrEmpty(strStartDate) &&
                !String.IsNullOrEmpty(strEndDate))
            {
                DateTime startDate = DateTime.Parse(strStartDate);
                DateTime endDate = DateTime.Parse(strEndDate);
                var games = DataAccess.Schedule.GetTeamSchedule(teamSeasonId, startDate, endDate);
                return Request.CreateResponse<IQueryable<ModelObjects.Game>>(HttpStatusCode.OK, games);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
