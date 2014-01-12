using ModelObjects;
using SportsManager;
using System.Collections;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

namespace DataAccess
{
/// <summary>
/// Summary description for LeagueNews.
/// </summary>
	static public class LeagueNews
	{
		static public SportsManager.Model.LeagueNew GetNewsItem(long newsId)
		{
            //	SELECT * FROM LeagueNews WHERE Id = @id
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.id == newsId
                    select ln).SingleOrDefault();
        }

		static public IQueryable<SportsManager.Model.LeagueNew> GetNewsHeadlines(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && !ln.SpecialAnnounce
                    orderby ln.Date descending
                    select ln).Take(3);
		}

		static public IQueryable<SportsManager.Model.LeagueNew> GetNews(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && !ln.SpecialAnnounce
                    orderby ln.Date descending
                    select ln);
		}

		static public IQueryable<SportsManager.Model.LeagueNew> GetAllNews(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId
                    orderby ln.Date descending
                    select ln);
		}

		static public IQueryable<SportsManager.Model.LeagueNew> GetSpecialAnnouncements(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && ln.SpecialAnnounce
                    orderby ln.Date descending
                    select ln);
		}

		static public bool ModifyNews(LeagueNewsItem newsItem)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateNewsItem", myConnection);
					myCommand.Parameters.Add("@newsDate", SqlDbType.SmallDateTime).Value = newsItem.Date;
					myCommand.Parameters.Add("@newsTitle", SqlDbType.VarChar, 100).Value = newsItem.Title;
					myCommand.Parameters.Add("@newsText", SqlDbType.Text).Value = newsItem.Text;
					myCommand.Parameters.Add("@specialAnnounce", SqlDbType.Bit).Value = newsItem.SpecialAnnounce;
					myCommand.Parameters.Add("@newsId", SqlDbType.BigInt).Value = newsItem.Id;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

		static public void AddNews(LeagueNewsItem newsItem)
		{
            DB db = DBConnection.GetContext();

            SportsManager.Model.LeagueNew dbLeagueNews = new SportsManager.Model.LeagueNew();
            newsItem.CopyTo(dbLeagueNews);
            db.LeagueNews.InsertOnSubmit(dbLeagueNews);
            db.SubmitChanges();

            newsItem.Id = dbLeagueNews.id;
		}

		static public bool RemoveNews(long newsId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteNewsItem", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = newsId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCount = 0;
			}

			return (rowCount <= 0) ? false : true;
		}
	}
}