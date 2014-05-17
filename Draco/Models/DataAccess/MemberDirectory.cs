using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace DataAccess
{
	/// <summary>
	/// Summary description for MemberDirectory
	/// </summary>
	static public class MemberDirectory
	{
		static public IQueryable<Sponsor> GetAccountMemberBusiness(long accountId)
		{
            DB db = DBConnection.GetContext();

			long seasonId = (from cs in db.CurrentSeasons
							 where cs.AccountId == accountId
							 select cs.SeasonId).SingleOrDefault();

			return (from mb in db.MemberBusinesses
					join c in db.Contacts on mb.ContactId equals c.Id
					join r in db.Rosters on c.Id equals r.ContactId
					join rs in db.RosterSeasons on r.Id equals rs.PlayerId
					join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
					join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
					where ls.SeasonId == seasonId
					orderby mb.Name
					select new Sponsor(
						mb.Id,
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

        static public bool CanCreateMemberBusiness(long accountId, long contactId)
        {
            DB db = DBConnection.GetContext();

            long seasonId = (from cs in db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs.SeasonId).SingleOrDefault();

            // if contact is on any roster in the current season, they can have a directory.
            return (from c in db.Contacts 
                    join r in db.Rosters on c.Id equals r.ContactId
                    join rs in db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where ls.SeasonId == seasonId && c.Id == contactId
                    select rs).Any();
        }

		static public Sponsor GetMemberBusinessFromContact(long contactId)
		{
            DB db = DBConnection.GetContext();

            return (from mb in db.MemberBusinesses
                        where mb.ContactId == contactId
                    select new Sponsor(
                        mb.Id,
                        mb.Name,
                        mb.StreetAddress,
                        mb.CityStateZip,
                        mb.Description,
                        mb.EMail,
                        mb.Phone,
                        mb.Fax,
                        mb.WebSite,
                        0,
                        0)
                        {
                            ContactId = mb.ContactId
                        }).SingleOrDefault();
        }

		static public Sponsor GetMemberBusiness(long id)
		{
            DB db = DBConnection.GetContext();

            return (from mb in db.MemberBusinesses
                    where mb.Id == id
					select new Sponsor(
						mb.Id,
						mb.Name,
						mb.StreetAddress,
						mb.CityStateZip,
						mb.Description,
						mb.EMail,
						mb.Phone,
						mb.Fax,
						mb.WebSite,
						0,
					    0) { 
                        ContactId = mb.ContactId 
                    }).SingleOrDefault();

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

		static public async Task<bool> RemoveMemberBusiness(Sponsor s)
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

					if (s.LogoURL != null)
                    {
                        await Storage.Provider.DeleteFile(HttpContext.Current.Server.MapPath(s.LogoURL));
                    }
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
