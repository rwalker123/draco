using System;
using System.Configuration;
using System.Data;
using System.Collections;
using System.Collections.Generic;
using System.Data.SqlClient;
using ModelObjects;

namespace DataAccess
{
/// <summary>
/// Summary description for ProfileAdmin
/// </summary>
	static public class ProfileAdmin
	{

		static public List<ProfileCategoryItem> GetCategories(long accountId)
		{
            List<ProfileCategoryItem> cats = new List<ProfileCategoryItem>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerProfileCategories", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						cats.Add(new ProfileCategoryItem(dr.GetInt64(0), dr.GetString(2), dr.GetInt32(3), dr.GetInt64(1)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return cats;
		}

		static public bool ModifyCategory(ProfileCategoryItem item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayerProfileCategory", myConnection);
					myCommand.Parameters.Add("@category", SqlDbType.VarChar, 25).Value = item.CategoryName;
					myCommand.Parameters.Add("@priority", SqlDbType.Int).Value = item.Priority;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = item.Id;
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

		static public bool AddCategory(ProfileCategoryItem item)
		{
			int rowCount = 0;

            if (item.AccountId <= 0)
                return false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreatePlayerProfileCategory", myConnection);
					myCommand.Parameters.Add("@category", SqlDbType.VarChar, 25).Value = item.CategoryName;
					myCommand.Parameters.Add("@priority", SqlDbType.Int).Value = item.Priority;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = item.AccountId;
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

		static public bool RemoveCategory(ProfileCategoryItem item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePlayerProfileCategory", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = item.Id;
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

		static public List<ProfileQuestionItem> GetQuestions(long catId)
		{
            List<ProfileQuestionItem> cats = new List<ProfileQuestionItem>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerProfileCategoryQuestions", myConnection);
					myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = catId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						cats.Add(new ProfileQuestionItem(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2), dr.GetInt32(3)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return cats;
		}

		static public bool ModifyQuestion(ProfileQuestionItem item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayerProfileCategoryQuestion", myConnection);
					myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = item.CategoryId;
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = item.Question;
					myCommand.Parameters.Add("@questionNum", SqlDbType.Int).Value = item.QuestionNum;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = item.Id;
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

		static public bool AddQuestion(ProfileQuestionItem item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("CreatePlayerProfileCategoryQuestion", myConnection);
					myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = item.CategoryId;
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = item.Question;
					myCommand.Parameters.Add("@questionNum", SqlDbType.Int).Value = item.QuestionNum;
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

		static public bool RemoveQuestion(ProfileQuestionItem item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePlayerProfileCategoryQuestion", myConnection);
					myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = item.Id;
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

		static public List<PlayerProfile> GetPlayersWithProfiles(long accountId)
		{
			List<PlayerProfile> playerProfiles = new List<PlayerProfile>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayersWithProfiles", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						playerProfiles.Add(new PlayerProfile(dr.GetInt64(0)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return playerProfiles;
		}

		static public bool RemovePlayerProfile(PlayerProfile playerProfile)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeletePlayerProfile", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerProfile.PlayerId;
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

		static public bool AddPlayerProfile(PlayerProfile item)
		{
			int rowCount = 1;

			Dictionary<long, string> answers = item.GetAnswers();

            RemoveEmptyAnswers(item, answers);

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
                    // add question command
					SqlCommand myCommand = new SqlCommand("dbo.CreatePlayerProfile", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = item.PlayerId;
					SqlParameter idParam = myCommand.Parameters.Add("@answerId", SqlDbType.BigInt);
					SqlParameter ansParam = myCommand.Parameters.Add("@answer", SqlDbType.Text);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();

					foreach (KeyValuePair<long,string> de in answers)
					{

                        if (!String.IsNullOrEmpty(de.Value))
                        {
                            idParam.Value = de.Key;
                            ansParam.Value = de.Value;

                            myCommand.Prepare();
                            myCommand.ExecuteNonQuery();
                        }
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCount = 0;
			}

			return (rowCount <= 0) ? false : true;
		}

        static private bool RemoveEmptyAnswers(PlayerProfile item, Dictionary<long, string> answers)
        {
            int rowCount = 1;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    // remove question command
                    SqlCommand quesCommand = new SqlCommand("dbo.DeletePlayerProfileQuestion", myConnection);
                    quesCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = item.PlayerId;
                    SqlParameter quesIdParam = quesCommand.Parameters.Add("@answerId", SqlDbType.BigInt);
                    quesCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();

                    foreach (KeyValuePair<long, string> de in answers)
                    {

                        if (String.IsNullOrEmpty(de.Value))
                        {
                            quesIdParam.Value = de.Key;

                            quesCommand.Prepare();
                            quesCommand.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return (rowCount <= 0) ? false : true;
        }


		static public bool ModifyPlayerProfile(PlayerProfile item)
		{
			int rowCount = 1;

			Dictionary<long, string> answers = item.GetAnswers();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdatePlayerProfile", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = item.PlayerId;
					SqlParameter idParam = myCommand.Parameters.Add("@questionId", SqlDbType.BigInt);
					SqlParameter ansParam = myCommand.Parameters.Add("@answer", SqlDbType.Text);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();

                    foreach (KeyValuePair<long, string> de in answers)
					{
						idParam.Value = de.Key;
						ansParam.Value = de.Value;

						myCommand.Prepare();

						myCommand.ExecuteNonQuery();
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
				rowCount = 0;
			}

			return (rowCount <= 0) ? false : true;
		}

		static public List<ProfileQuestionAnswer> GetPlayerQuestionAnswer(long playerId)
		{
            List<ProfileQuestionAnswer> qa = new List<ProfileQuestionAnswer>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetProfileQuestionAnswer", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						qa.Add(new ProfileQuestionAnswer(dr.GetInt64(0), dr.GetString(1), dr.GetString(2)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return qa;
		}

		static public string GetAnswer(long playerId, long questionId)
		{
			string ret = String.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerProfileAnswer", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerId;
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						ret = dr.GetString(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return ret;
		}

		static public PlayerProfile GetProfileSpotlight(long accountId)
		{
			PlayerProfile p = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetPlayerProfileSpotlight", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						p = new PlayerProfile(dr.GetInt64(0));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return p;
		}

		static public long HasPlayerProfile(long playerSeasonId)
		{
			long pId = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.HasPlayerProfile", myConnection);
					myCommand.Parameters.Add("@playerId", SqlDbType.BigInt).Value = playerSeasonId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						pId = dr.GetInt64(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return pId;
		}
	}
}
