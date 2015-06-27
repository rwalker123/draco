using System;
using System.Linq;
using System.Web.SessionState;

namespace DataAccess.SocialIntegration
{
    /// <summary>
    /// Summary description for Facebook
    /// </summary>
    public static class Facebook
    {
        private static string FacebookConnectString = "FacebookConnectId";

        public static string FacebookFanPage(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from a in db.Accounts
                    where a.Id == accountId
                    select a.FacebookFanPage).SingleOrDefault();
        }

        public static bool SetFacebookFanPage(long accountId, string pageName)
        {
            DB db = DBConnection.GetContext();
            var account = (from a in db.Accounts
                           where a.Id == accountId
                           select a).SingleOrDefault();
            if (account != null)
            {
                account.FacebookFanPage = pageName;
                db.SaveChanges();
                return true;
            }

            return false;
        }

        public static string GetApiKey(int accountType)
        {
            string apiKey = String.Empty;

            try
            {
                DB db = DBConnection.GetContext();

                apiKey = (from f in db.AccountTypes
                          where f.Id == accountType
                          select f.FacebookAppId).SingleOrDefault();
            }
            catch (Exception ex)
            {
                Elmah.ErrorSignal.FromCurrentContext().Raise(ex);
            }

            return apiKey;
        }

        public static string GetSecretKey(int accountType)
        {
            string secretKey = String.Empty;

            try
            {
                DB db = DBConnection.GetContext();

                secretKey = (from f in db.AccountTypes
                          where f.Id == accountType
                          select f.FacebookSecretKey).SingleOrDefault();
            }
            catch (Exception ex)
            {
                Elmah.ErrorSignal.FromCurrentContext().Raise(ex);
            }

            return secretKey;
        }

        public static bool IsCurrentUserLoggedIntoFacebook() 
        {
            bool isLoggedIn = false;

            HttpSessionState s = System.Web.HttpContext.Current.Session;
            if (s != null)
            {
                // todo: should somehow verify data in session.
                isLoggedIn = s[FacebookConnectString] != null ? true : false;
            }
            return isLoggedIn;
        }
 
        public static void LogoutFromFacebook()
        {
            HttpSessionState s = System.Web.HttpContext.Current.Session;
            if (s != null)
            {
                s.Remove(FacebookConnectString);
            }
        }
    }
}
