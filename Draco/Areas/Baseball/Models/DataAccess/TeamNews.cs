using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;

namespace DataAccess
{
	/// <summary>
	/// Summary description for TeamNews.
	/// </summary>
	static public class TeamNews
	{
		static private LeagueNewsItem CreateNewsItem(SqlDataReader dr)
		{
			return new LeagueNewsItem(dr.GetInt64(0), dr.GetDateTime(2), String.Empty, dr.GetString(3), false, dr.GetInt64(1));
		}

		static public LeagueNewsItem GetTeamAnnouncement(long newsId)
		{
			LeagueNewsItem newsItem = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamAnnouncement", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = newsId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						newsItem = CreateNewsItem(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return newsItem;
		}

		static public List<LeagueNewsItem> GetTeamAnnouncements(long teamSeasonId)
		{
            List<LeagueNewsItem> news = new List<LeagueNewsItem>();

			try
			{

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTeamAnnouncements", myConnection);
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = teamSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						news.Add(CreateNewsItem(dr));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return news;
		}

        static public List<LeagueNewsItem> GetContactTeamNews(long accountId, long contactId)
        {
            List<LeagueNewsItem> news = new List<LeagueNewsItem>();

            try
            {

                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetContactTeamNews", myConnection);
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    while (dr.Read())
                    {
                        news.Add(CreateNewsItem(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return news;
        }

        static public bool ModifyTeamAnnouncement(LeagueNewsItem newsItem)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateTeamAnnouncement", myConnection);
					myCommand.Parameters.Add("@newsDate", SqlDbType.SmallDateTime).Value = newsItem.Date;
					myCommand.Parameters.Add("@newsText", SqlDbType.Text).Value = newsItem.Text;
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

		static public bool AddTeamAnnouncement(LeagueNewsItem newsItem)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateTeamAnnouncement", myConnection);
					myCommand.Parameters.Add("@newsDate", SqlDbType.SmallDateTime).Value = newsItem.Date;
					myCommand.Parameters.Add("@newsText", SqlDbType.Text).Value = newsItem.Text;
					myCommand.Parameters.Add("@teamSeasonId", SqlDbType.BigInt).Value = newsItem.AccountId;
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

			return (rowCount > 0);
		}

		static public bool RemoveTeamAnnouncement(LeagueNewsItem newsItem)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteTeamAnnouncement", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = newsItem.Id;
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