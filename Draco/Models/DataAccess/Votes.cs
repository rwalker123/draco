using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;

namespace DataAccess
{
/// <summary>
/// Summary description for Votes
/// </summary>
	static public class Votes
	{
		static public VoteQuestion[] GetVoteQuestions(long accountId)
		{
			ArrayList voteQuestions = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetVoteQuestions", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						voteQuestions.Add(new VoteQuestion(dr.GetInt64(0), dr.GetString(2), dr.GetBoolean(3), dr.GetInt64(1)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (VoteQuestion[])voteQuestions.ToArray(typeof(VoteQuestion));
		}

		static public VoteQuestion GetVoteQuestion(long id)
		{
			VoteQuestion voteQuestion = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetVoteQuestion", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						voteQuestion  = new VoteQuestion(dr.GetInt64(0), dr.GetString(2), dr.GetBoolean(3), dr.GetInt64(1));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return voteQuestion;
		}

		static public VoteQuestion[] GetActiveVotes(long accountId)
		{
			ArrayList voteQuestions = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetActiveVoteQuestions", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						voteQuestions.Add(new VoteQuestion(dr.GetInt64(0), dr.GetString(2), dr.GetBoolean(3), dr.GetInt64(1)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (VoteQuestion[])voteQuestions.ToArray(typeof(VoteQuestion));
		}

		static public bool ModifyVoteQuestion(VoteQuestion voteQuestion)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateVoteQuestion", myConnection);
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = voteQuestion.Question;
					myCommand.Parameters.Add("@active", SqlDbType.Bit).Value = voteQuestion.Active;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = voteQuestion.Id;
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

		static public bool AddVoteQuestion(VoteQuestion voteQuestion)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateVoteQuestion", myConnection);
					myCommand.Parameters.Add("@question", SqlDbType.VarChar, 255).Value = voteQuestion.Question;
					myCommand.Parameters.Add("@active", SqlDbType.Bit).Value = voteQuestion.Active;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = voteQuestion.AccountId;
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

		static public bool RemoveVoteQuestion(VoteQuestion v)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteVoteQuestion", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = v.Id;
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

		static public List<VoteOption> GetVoteOptions(long questionId)
		{
			    List<VoteOption> voteOptions = new List<VoteOption>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetVoteOptions", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						voteOptions.Add(new VoteOption(dr.GetInt64(0), dr.GetInt64(1), dr.GetString(2), dr.GetInt32(3)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return voteOptions;
		}

		static public bool ModifyVoteOption(VoteOption voteOption)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateVoteOption", myConnection);
					myCommand.Parameters.Add("@optionText", SqlDbType.VarChar, 255).Value = voteOption.OptionText;
					myCommand.Parameters.Add("@priority", SqlDbType.Int).Value = voteOption.Priority;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = voteOption.Id;
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

		static public bool AddVoteOption(VoteOption voteOption)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateVoteOption", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = voteOption.QuestionId;
					myCommand.Parameters.Add("@optionText", SqlDbType.VarChar, 255).Value = voteOption.OptionText;
					myCommand.Parameters.Add("@priority", SqlDbType.BigInt).Value = voteOption.Priority;
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

		static public bool RemoveVoteOption(VoteOption v)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteVoteOption", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = v.Id;
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

		static public bool EnterVote(long questionId, long optionId, long contactId)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.EnterVote", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.Parameters.Add("@optionId", SqlDbType.BigInt).Value = optionId;
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
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

		static public VoteResults[] GetVoteResults(long questionId)
		{
			ArrayList voteResults = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetVoteResults", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						voteResults.Add(new VoteResults(dr.GetInt64(0), dr.GetString(1), dr.GetInt32(2)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (VoteResults[])voteResults.ToArray(typeof(VoteResults));
		}

		static public bool HasVoted(long questionId, long contactId)
		{
			bool hasVoted = false;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.HasVoted", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					int voteResult = (int)myCommand.ExecuteScalar();

					hasVoted = (voteResult > 0);
					
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return hasVoted;
		}

		static public int GetTotalVotes(long questionId)
		{
			int total = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetTotalVotes", myConnection);
					myCommand.Parameters.Add("@questionId", SqlDbType.BigInt).Value = questionId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						total = dr.GetInt32(0);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return total;
		}
	}
}