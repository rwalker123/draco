using ModelObjects;
using System;
using System.Collections;
using System.Data;
using System.Data.SqlClient;


namespace DataAccess
{
	/// <summary>
	/// Summary description for Affiliations
	/// </summary>
	static public class Affiliations
	{
		static public Affiliation[] GetAffiliations()
		{
			ArrayList affiliations = new ArrayList();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetAffiliations", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myConnection.Open();

					SqlDataReader dr = myCommand.ExecuteReader();

					while (dr.Read())
					{
						affiliations.Add( new Affiliation( dr.GetInt64(0), dr.GetString(1) ) );
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return (Affiliation[])affiliations.ToArray(typeof(Affiliation));
		}

		static public bool IsValidName(string organizationName)
		{
			bool validOrganizationName = true;

			// remove all spaces from names and then do a case insensitive
			// compare.
			string compareOrganization = organizationName.ToLower();

			compareOrganization = compareOrganization.Replace(" ", String.Empty);

			Affiliation[] organizations = GetAffiliations();
			foreach (Affiliation org in organizations)
			{
				string compareWithOrganization = org.Name.ToLower();
				compareWithOrganization = compareWithOrganization.Replace(" ", String.Empty);

				if (compareOrganization == compareWithOrganization)
				{
					validOrganizationName = false;
					break;
				}
			}

			return validOrganizationName;
		}

		static public bool ModifyAffiliation(Affiliation affiliation)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.ModifyAffiliation", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = affiliation.Id;
					myCommand.Parameters.Add("@Name", SqlDbType.VarChar, 75).Value = affiliation.Name;
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

		static public bool AddAffiliation(Affiliation affiliation)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateAffiliation", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 75).Value = affiliation.Name;
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

		static public bool RemoveAffiliation(Affiliation affiliation)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteAffiliation", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = affiliation.Id;
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

		static public string GetAffiliationNameFromId(long id)
		{
			string affiliationName = string.Empty;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetAffiliationName", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();

					if (dr.Read())
					{
						affiliationName = dr.GetString(0);
					}
				}
			}
			catch (SqlException ex)
			{
                Globals.LogException(ex);
			}

			return affiliationName;
		}

	}
}