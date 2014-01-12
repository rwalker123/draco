using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;

namespace DataAccess
{
/// <summary>
/// Summary description for LeagueFAQ
/// </summary>
	static public class LeagueFAQ
	{
		static public LeagueFAQItem GetFAQItem(long faqId)
		{
			LeagueFAQItem i = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetFAQItem", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = faqId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						i = new LeagueFAQItem(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetInt64(1));
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return i;
		}

		static public LeagueFAQItem[] GetFAQ(long accountId)
		{
			ArrayList faq = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetFAQ", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						faq.Add( new LeagueFAQItem(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetInt64(1)));
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return (LeagueFAQItem[])faq.ToArray(typeof(LeagueFAQItem));
		}

		static public bool ModifyFAQ(LeagueFAQItem faq)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateFAQ", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = faq.Id;
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = faq.Question;
					myCommand.Parameters.Add("@answer", SqlDbType.Text).Value = faq.Answer;

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

		static public bool AddFAQ(LeagueFAQItem faq)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateFAQ", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = faq.Question;
					myCommand.Parameters.Add("@answer", SqlDbType.Text).Value = faq.Answer;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = faq.AccountId;

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

		static public bool RemoveFAQ(LeagueFAQItem faq)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteFAQ", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = faq.Id;

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
	}
}