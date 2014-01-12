using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using ModelObjects;
using SportsManager;

namespace DataAccess
{
	/// <summary>
	/// Summary description for MemberDirectory
	/// </summary>
	static public class MemberDirectory
	{
		static private Sponsor CreateSponsor(SqlDataReader dr)
		{
			return new Sponsor(dr.GetInt64(0), dr.GetString(2), dr.GetString(3), dr.GetString(4), dr.GetString(5), dr.GetString(6), dr.GetString(7), dr.GetString(8), dr.GetString(9), dr.GetInt64(1), 0);
		}

		static public IEnumerable<Sponsor> GetAccountMemberBusiness(long accountId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from cs in db.CurrentSeasons
							 where cs.AccountId == accountId
							 select cs.SeasonId).SingleOrDefault();

			return (from mb in db.MemberBusinesses
					join c in db.Contacts on mb.ContactId equals c.Id
					join r in db.Rosters on c.Id equals r.ContactId
					join rs in db.RosterSeasons on r.id equals rs.PlayerId
					join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.id
					join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.id
					where ls.SeasonId == seasonId
					orderby mb.Name
					select new Sponsor(
						mb.id,
						mb.Name,
						mb.StreetAddress,
						mb.CityStateZip,
						mb.Description,
						mb.EMail,
						mb.Phone,
						mb.Fax,
						mb.WebSite,
						0,
						accountId) { ContactId = c.Id }).Distinct();
		}

		static public Sponsor GetMemberBusinessOfDay(long accountId)
		{

			Sponsor sponsor = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetMemberBusinessOfDay", myConnection);
					myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						sponsor = CreateSponsor(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return sponsor;
		}

		static public Sponsor GetMemberBusinessFromContact(long contactId)
		{
			Sponsor sponsor = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetMemberBusinessFromContact", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						sponsor = CreateSponsor(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return sponsor;
		}

		static public Sponsor GetMemberBusiness(long id)
		{
			Sponsor sponsor = null;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.GetMemberBusiness", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
					myConnection.Open();
					myCommand.Prepare();

					SqlDataReader dr = myCommand.ExecuteReader();
					if (dr.Read())
					{
						sponsor = CreateSponsor(dr);
					}
				}
			}
			catch (SqlException ex)
			{
				Globals.LogException(ex);
			}

			return sponsor;
		}

		static public bool ModifyMemberBusiness(Sponsor s)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.UpdateMemberBusiness", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = s.Name;
					myCommand.Parameters.Add("@streetAddress", SqlDbType.VarChar, 100).Value = s.StreetAddress;
					myCommand.Parameters.Add("@cityStateZip", SqlDbType.VarChar, 100).Value = s.CityStateZip;
					myCommand.Parameters.Add("@description", SqlDbType.Text).Value = s.Description;
					myCommand.Parameters.Add("@eMail", SqlDbType.VarChar, 100).Value = s.EMail;
					myCommand.Parameters.Add("@phone", SqlDbType.VarChar, 14).Value = s.Phone;
					myCommand.Parameters.Add("@fax", SqlDbType.VarChar, 14).Value = s.Fax;
					myCommand.Parameters.Add("@webSite", SqlDbType.VarChar, 100).Value = s.Website;
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

		static public long AddMemberBusiness(Sponsor s)
		{
			long id = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.CreateMemberBusiness", myConnection);
					myCommand.CommandType = System.Data.CommandType.StoredProcedure;
					myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = s.Name;
					myCommand.Parameters.Add("@streetAddress", SqlDbType.VarChar, 100).Value = s.StreetAddress;
					myCommand.Parameters.Add("@cityStateZip", SqlDbType.VarChar, 100).Value = s.CityStateZip;
					myCommand.Parameters.Add("@description", SqlDbType.Text).Value = s.Description;
					myCommand.Parameters.Add("@eMail", SqlDbType.VarChar, 100).Value = s.EMail;
					myCommand.Parameters.Add("@phone", SqlDbType.VarChar, 14).Value = s.Phone;
					myCommand.Parameters.Add("@fax", SqlDbType.VarChar, 14).Value = s.Fax;
					myCommand.Parameters.Add("@webSite", SqlDbType.VarChar, 100).Value = s.Website;
					myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = s.ContactId;
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

		static public bool RemoveMemberBusiness(Sponsor s)
		{
			int rowCount = 0;

			try
			{
				using (SqlConnection myConnection = DBConnection.GetSqlConnection())
				{
					SqlCommand myCommand = new SqlCommand("dbo.DeleteMemberBusiness", myConnection);
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

	}
}
