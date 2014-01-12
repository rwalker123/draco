using System;
using System.Linq;
using System.Web.Security;
using System.Web.SessionState;
using SportsManager;
using SportsManager.Model;

/// <summary>
/// Summary description for Twitter
/// </summary>
namespace DataAccess.SocialIntegration
{
	public static class Twitter
	{
        public static string GetTwitterWidgetScript(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from a in db.Accounts
                    where a.Id == accountId
                    select a.TwitterWidgetScript).SingleOrDefault();
        }

        public static bool SetTwitterWidgetScript(long accountId, string script)
        {
            DB db = DBConnection.GetContext();
            var account = (from a in db.Accounts
                           where a.Id == accountId
                           select a).SingleOrDefault();

            if (account != null)
            {
                account.TwitterWidgetScript = script;
                db.SubmitChanges();
                return true;
            }

            return false;
        }

		public static string GetApiKey(long accountType)
		{
			string apiKey = String.Empty;

			try
			{
                DB db = DBConnection.GetContext();

				apiKey = (from f in db.AccountTypes
						  where f.Id == accountType
						  select f.TwitterAppId).SingleOrDefault();
			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

			return apiKey;
		}

		public static string GetSecretKey(long accountType)
		{
			string secretKey = String.Empty;

			try
			{
                DB db = DBConnection.GetContext();

				secretKey = (from f in db.AccountTypes
							 where f.Id == accountType
							 select f.TwitterSecret).SingleOrDefault();
			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

			return secretKey;
		}

		public static string TwitterAccountName(long accountId)
		{
			string accName = String.Empty;

			try
			{
                DB db = DBConnection.GetContext();

				accName = (from a in db.Accounts
						   where a.Id == accountId
						   select a.TwitterAccountName).SingleOrDefault();
			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

			return accName;
		}

		public static void SetTwitterAccountName(long accountId, string twitterAccountName)
		{
			try
			{
                DB db = DBConnection.GetContext();

				Account acc = (from a in db.Accounts
							   where a.Id == accountId
							   select a).SingleOrDefault();

				acc.TwitterAccountName = twitterAccountName ?? String.Empty;

				db.SubmitChanges();
			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}
		}

		private static Account GetAccountTwiterData(long accountId)
		{
			Account acc = null;

			try
			{
                DB db = DBConnection.GetContext();

				acc = (from a in db.Accounts
					   where a.Id == accountId
					   select a).SingleOrDefault();

			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

			return acc;
		}

		public static bool SetupTwitterStatusUpdate(long accountId, string tweetText)
		{
			bool isTwitterConfigured = false;

			Account a = GetAccountTwiterData(accountId);

			if (!String.IsNullOrEmpty(a.TwitterAccountName))
			{
				HttpSessionState s = System.Web.HttpContext.Current.Session;

				s["TwitterStatus"] = tweetText;
				s["TwitterAccount"] = a.TwitterAccountName;
				s["TwitterReqCode"] = "s";

				if (a.TwitterOauthToken.Length > 0)
					s["TwitterAuthToken"] = a.TwitterOauthToken;

				if (a.TwitterOauthSecretKey.Length > 0)
					s["TwitterAuthSecretKey"] = a.TwitterOauthSecretKey;

				isTwitterConfigured = true;
			}

			return isTwitterConfigured;
		}

		public static void SaveCurrentAccountAuth(long accountId, string authToken, string authSecretKey)
		{
			try
			{
                DB db = DBConnection.GetContext();

				Account acc = (from a in db.Accounts
							   where a.Id == accountId
							   select a).SingleOrDefault();

				if (acc != null)
				{
					acc.TwitterOauthToken = authToken;
					acc.TwitterOauthSecretKey = authSecretKey;

					db.SubmitChanges();
				}

			}
			catch (Exception ex)
			{
				Globals.LogException(ex);
			}

		}

	}
}
