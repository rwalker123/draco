using LinqToTwitter;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class TwitterOauthController : Controller
    {
        //[SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<ActionResult> BeginAsync(long accountId)
        {
            //var auth = new MvcSignInAuthorizer
            var auth = new MvcAuthorizer
            {
                CredentialStore = new SessionStateCredentialStore
                {
                    ConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"]
                }
            };
            string twitterCallbackUrl = Request.Url.ToString().Replace("Begin", "Complete");
            return await auth.BeginAuthorizationAsync(new Uri(twitterCallbackUrl));
        }

        //[SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<ActionResult> CompleteAsync(long accountId)
        {
            var auth = new MvcAuthorizer
            {
                CredentialStore = new SessionStateCredentialStore()
            };

            await auth.CompleteAuthorizeAsync(Request.Url);

            // This is how you access credentials after authorization.
            // The oauthToken and oauthTokenSecret do not expire.
            // You can use the userID to associate the credentials with the user.
            // You can save credentials any way you want - database, 
            //   isolated storage, etc. - it's up to you.
            // You can retrieve and load all 4 credentials on subsequent 
            //   queries to avoid the need to re-authorize.
            // When you've loaded all 4 credentials, LINQ to Twitter will let 
            //   you make queries without re-authorizing.
            //
            var credentials = auth.CredentialStore;
            string oauthToken = credentials.OAuthToken;
            string oauthTokenSecret = credentials.OAuthTokenSecret;
            string screenName = credentials.ScreenName;
            ulong userID = credentials.UserID;

            var account = DataAccess.Accounts.GetAccount(accountId);

            if (screenName.Equals(account.TwitterAccountName, StringComparison.InvariantCultureIgnoreCase))
            {
                DataAccess.SocialIntegration.Twitter.SaveCurrentAccountAuth(accountId, oauthToken, oauthTokenSecret);
            }

            return RedirectToAction("Index", "Home");
        }

        public async Task<ActionResult> HomeTimelineAsync()
        {
            var auth = new MvcAuthorizer
            {
                CredentialStore = new SessionStateCredentialStore()
            };

            var ctx = new TwitterContext(auth);

            var tweets =
                await
                (from tweet in ctx.Status
                 where tweet.Type == StatusType.Home
                 select new  //TweetViewModel
                 {
                     ImageUrl = tweet.User.ProfileImageUrl,
                     ScreenName = tweet.User.ScreenNameResponse,
                     Text = tweet.Text
                 })
                .ToListAsync();

            return View(tweets);
        }

    }
}