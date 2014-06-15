using LinqToTwitter;
using System;
using System.Configuration;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class TwitterOauthController : Controller
    {
        //[SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<ActionResult> BeginAsync(long accountId)
        {
            //var auth = new MvcSignInAuthorizer
            var auth = new MvcSignInAuthorizer
            {
                CredentialStore = new SessionStateCredentialStore
                {
                    ConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"],
                    OAuthToken = null,
                    OAuthTokenSecret = null
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

            return CompleteTwitterOauth(accountId, auth);
        }

        private ActionResult CompleteTwitterOauth(long accountId, MvcAuthorizer auth)
        {
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
            if (account == null)
            {
                throw new Exception("Invalid Account");
            }

            if (screenName.Equals(account.TwitterAccountName, StringComparison.InvariantCultureIgnoreCase))
            {
                DataAccess.SocialIntegration.Twitter.SaveCurrentAccountAuth(accountId, oauthToken, oauthTokenSecret);

                string refererUri = Request.QueryString.Get("twitterAction");
                if (!String.IsNullOrEmpty(refererUri))
                {
                    return Redirect(refererUri);
                }
            }
            else
            {
                Session["twitterError"] = "Screen name mismatch, expected: " + account.TwitterAccountName + " got: " + screenName;
                string refererUri = Request.QueryString.Get("referer");
                if (!String.IsNullOrEmpty(refererUri))
                {
                    return Redirect(refererUri);
                }
            }


            return RedirectToAction("Index", "Home");
        }

        public async Task<ActionResult> SendTweetAsync(long accountId, string tweet)
        {
            var a = DataAccess.SocialIntegration.Twitter.GetAccountTwitterData(accountId);

            if (String.IsNullOrEmpty(a.TwitterOauthSecretKey) || String.IsNullOrEmpty(a.TwitterOauthToken))
            {
                Session["twitterRetries"] = 1;
                return RedirectToAction("BeginAsync", "TwitterOauth", new
                {
                    area = "",
                    referer = Request.QueryString.Get("referer") ?? "",
                    twitterAction = Request.Url.ToString(),
                    accountId = accountId,
                    twitterStatus = tweet,
                    twitterAccount = a.TwitterAccountName,
                    twitterReqCode = "s"
                });
            }

            var auth = new MvcAuthorizer
            {
                CredentialStore = new SessionStateCredentialStore()
                {
                    ConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"],
                    OAuthToken = a.TwitterOauthToken,
                    OAuthTokenSecret = a.TwitterOauthSecretKey
                }
            };

            var ctx = new TwitterContext(auth);

            var refererUri = Request.QueryString.Get("referer");
            try
            {
                Status responseTweet = await ctx.TweetAsync(tweet);
            }
            catch (TwitterQueryException ex)
            {
                // if we get an authentication error, try to have the user log in.
                if (ex.ErrorCode == 32 && Session["twitterRetries"] == null)
                {
                    Session["twitterRetries"] = 1;
                    return RedirectToAction("BeginAsync", "TwitterOauth", new
                    {
                        area = "",
                        referer = Request.QueryString.Get("referer") ?? "",
                        twitterAction = Request.Url.ToString(),
                        accountId = accountId,
                        twitterStatus = tweet,
                        twitterAccount = a.TwitterAccountName,
                        twitterReqCode = "s"
                    });
                }
                else
                {
                    Session["twitterError"] = ex.ErrorCode + ": " + ex.Message;
                }
            }

            return Redirect(refererUri);
        }

    }
}