using System;
using System.Data.SqlClient;
using System.Configuration;
using SportsManager;
using System.Web;

namespace DataAccess
{
	/// <summary>
	/// Summary description for DBConnection
	/// </summary>
    static public class DBConnection
    {
        static public SqlConnection GetSqlConnection()
        {
            ConnectionStringSettings sqlConnectionString = ConfigurationManager.ConnectionStrings["webDBConnection"];

            return new SqlConnection(sqlConnectionString.ConnectionString);
        }

        private const string ObjectContextKey = "ObjectContext";

        static public DB GetContext()
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
