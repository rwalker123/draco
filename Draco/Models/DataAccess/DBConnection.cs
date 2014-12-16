using SportsManager;
using System;
using System.Web;

namespace DataAccess
{
	/// <summary>
	/// Summary description for DBConnection
	/// </summary>
    static public class DBConnection
    {
        private const string ObjectContextKey = "ObjectContext";

        static internal DB GetContext()
        {
            HttpContext httpContext = HttpContext.Current;
            if (httpContext != null)
            {
                string contextTypeKey = ObjectContextKey + typeof(DB).Name;
                if (httpContext.Items[contextTypeKey] == null)
                {
                    httpContext.Items.Add(contextTypeKey, new DB());
                }
                return httpContext.Items[contextTypeKey] as DB;
            }

            throw new ApplicationException("There is no Http Context available");
        }
    }
}
