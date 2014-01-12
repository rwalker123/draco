using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;

namespace DataAccess
{
	/// <summary>
	/// Summary description for AccountHandouts
	/// </summary>
	static public class AccountHandouts
	{
		static private AccountHandout CreateHandout(SqlDataReader dr)
		{
			return new AccountHandout(dr.GetInt64(0), dr.GetString(1), dr.GetString(2), dr.GetInt64(3));
		}

		static public AccountHandout GetHandout(long id)
		{
			AccountHandout h = null;

			try
			{

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetHandout", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
					myCommand.Parameters.Add("@isAccount", SqlDbType.Int).Value = 1;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						h = CreateHandout(dr);
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return h;
		}

		static public AccountHandout[] GetAccountHandouts(long accountId)
		{
			ArrayList items = new ArrayList();

			try
			{

				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetAccountHandouts", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						items.Add(CreateHandout(dr));
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return (AccountHandout[])items.ToArray(typeof(AccountHandout));
		}

		static public bool ModifyAccountHandout(AccountHandout item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateAccountHandout", myConnection);
					myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = item.Description;
					myCommand.Parameters.Add("@fileName", SqlDbType.VarChar, 255).Value = item.FileName;
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
			}

			return (rowCount <= 0) ? false : true;
		}

		static public long AddAccountHandout(AccountHandout item)
		{
			long id = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateAccountHandout", myConnection);
					myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = item.Description;
					myCommand.Parameters.Add("@fileName", SqlDbType.VarChar, 255).Value = item.FileName;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = item.ReferenceId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
						id = dr.GetInt64(0);
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return id;
		}

		static public bool RemoveAccountHandout(AccountHandout item)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteAccountHandout", myConnection);
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = item.Id;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;

					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();

					if (item.HandoutFile != null)
					{
						System.IO.FileInfo fi = new System.IO.FileInfo(item.HandoutFile);
						fi.Delete();
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
				rowCount = 0;
			}

			return (rowCount > 0);
		}
	}
}
