using SportsManager;
using SportsManager.Model;
using System;
using System.Linq;

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
            DB db = DBConnection.GetContext();

            return (from f in db.AccountTypes
                    where f.Id == accountType
                    select f.TwitterAppId).SingleOrDefault();
        }

        public static string GetSecretKey(long accountType)
        {
            DB db = DBConnection.GetContext();

            return (from f in db.AccountTypes
                    where f.Id == accountType
                    select f.TwitterSecret).SingleOrDefault();
        }

		public static string TwitterAccountName(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.Id == accountId
                    select a.TwitterAccountName).SingleOrDefault();
		}

        public static void SetTwitterAccountName(long accountId, string twitterAccountName)
        {
            DB db = DBConnection.GetContext();

            Account acc = (from a in db.Accounts
                           where a.Id == accountId
                           select a).SingleOrDefault();

            acc.TwitterAccountName = twitterAccountName ?? String.Empty;

            db.SubmitChanges();
        }

		public static Account GetAccountTwitterData(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.Id == accountId
                    select a).SingleOrDefault();
		}

		public static void SaveCurrentAccountAuth(long accountId, string authToken, string authSecretKey)
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
	}
}
