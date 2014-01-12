using System;
using System.Configuration;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;

using System.Collections.Generic;

namespace DataAccess
{
/// <summary>
/// Summary description for Sponsors
/// </summary>
	static public class Sponsors
	{
		static public List<Sponsor> GetSponsors( long accountId )
		{
			List<Sponsor> sponsors = new List<Sponsor>();

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetSponsors", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					while (dr.Read())
					{
						sponsors.Add(new Sponsor(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9), dr.GetInt64(10), dr.GetInt64(1)));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}


			return sponsors;
		}

		static public Sponsor GetSponsorOfDay( long accountId )
		{
			Sponsor sponsor = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetSponsorOfDay", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						sponsor = new Sponsor(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9), dr.GetInt64(10), dr.GetInt64(1));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return sponsor;
		}

		static public Sponsor GetSponsor(long id)
		{
			Sponsor sponsor = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetSponsor", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						sponsor = new Sponsor(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9), dr.GetInt64(10), dr.GetInt64(1));
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return sponsor;
		}

		static public bool ModifySponsor(Sponsor s)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateSponsor", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = s.Name;
					myCommand.Parameters.Add("@streetAddress", SqlDbType.VarChar, 100).Value = s.StreetAddress;
					myCommand.Parameters.Add("@cityStateZip", SqlDbType.VarChar, 100).Value = s.CityStateZip;
					myCommand.Parameters.Add("@description", SqlDbType.Text).Value = s.Description;
					myCommand.Parameters.Add("@eMail", SqlDbType.VarChar, 100).Value = s.EMail;
					myCommand.Parameters.Add("@phone", SqlDbType.VarChar, 14).Value = s.Phone;
					myCommand.Parameters.Add("@fax", SqlDbType.VarChar, 14).Value = s.Fax;
					myCommand.Parameters.Add("@webSite", SqlDbType.VarChar, 100).Value = s.Website;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = s.TeamId;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = s.Id;
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

		static public long AddSponsor(Sponsor s)
		{
			long id = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateSponsor", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = s.Name;
					myCommand.Parameters.Add("@streetAddress", SqlDbType.VarChar, 100).Value = s.StreetAddress;
					myCommand.Parameters.Add("@cityStateZip", SqlDbType.VarChar, 100).Value = s.CityStateZip;
					myCommand.Parameters.Add("@description", SqlDbType.Text).Value = s.Description;
					myCommand.Parameters.Add("@eMail", SqlDbType.VarChar, 100).Value = s.EMail;
					myCommand.Parameters.Add("@phone", SqlDbType.VarChar, 14).Value = s.Phone;
					myCommand.Parameters.Add("@fax", SqlDbType.VarChar, 14).Value = s.Fax;
					myCommand.Parameters.Add("@webSite", SqlDbType.VarChar, 100).Value = s.Website;
					myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = s.TeamId;
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = s.AccountId;
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

		static public bool RemoveSponsor(Sponsor s)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteSponsor", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = s.Id;
					myConnection.Open();
					myCommand.Prepare();

					rowCount = myCommand.ExecuteNonQuery();

					if (s.LogoFile != null)
						System.IO.File.Delete(s.LogoFile);
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return (rowCount <= 0) ? false : true;
		}

        static public List<Sponsor> GetTeamSponsors(long teamId, bool fromTeamSeason)
        {
            List<Sponsor> sponsors = new List<Sponsor>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetTeamSponsors", myConnection);
                    myCommand.Parameters.Add("@teamId", SqlDbType.BigInt).Value = teamId;
                    myCommand.Parameters.Add("@fromTeamSeason", SqlDbType.Bit).Value = fromTeamSeason;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    while (dr.Read())
                    {
                        sponsors.Add(new Sponsor(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9), dr.GetInt64(10), dr.GetInt64(1)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }


            return sponsors;
        }

    }
}