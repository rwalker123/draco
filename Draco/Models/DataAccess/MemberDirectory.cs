using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
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
						accountId) 
                        { 
                            ContactId = c.Id,
                            ContactName = c.FirstName + " " + c.LastName,
                            ContactPhotoUrl = Contact.GetPhotoURL(c.Id)
                        }).Distinct();
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
                            ContactId = mb.ContactId,
                            ContactName = mb.Contact.FirstName + " " + mb.Contact.LastName,
                            ContactPhotoUrl = Contact.GetPhotoURL(mb.ContactId)
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
                        0)
                        {
                            ContactId = mb.ContactId,
                            ContactName = mb.Contact.FirstName + " " + mb.Contact.LastName,
                            ContactPhotoUrl = Contact.GetPhotoURL(mb.ContactId)
                        }).SingleOrDefault();

		}

        static public Sponsor GetRandomMemberBusiness(long accountId)
        {
            DB db = DBConnection.GetContext();

            var qry = (from cs in db.CurrentSeasons
                           join ls in db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                           join r in db.Rosters on rs.PlayerId equals r.Id
                           join c in db.Contacts on r.ContactId equals c.Id
                           join mbu in db.MemberBusinesses on c.Id equals mbu.ContactId
                           where cs.AccountId == accountId && !rs.Inactive && mbu.Id != null &&
                           c.CreatorAccountId == accountId
                           select mbu);

            int count = qry.Count();
            int index = new Random().Next(count);

            var mb = qry.Skip(index).FirstOrDefault();

            if (mb != null)
                return new Sponsor(
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
                            ContactId = mb.ContactId,
                            ContactName = mb.Contact.FirstName + " " + mb.Contact.LastName,
                            ContactPhotoUrl = Contact.GetPhotoURL(mb.ContactId)
                        };

            return null;
        }
        
        static public bool ModifyMemberBusiness(Sponsor s)
		{
            DB db = DBConnection.GetContext();

            var dbSponsor = (from mb in db.MemberBusinesses
                             where mb.Id == s.Id && mb.ContactId == s.ContactId
                             select mb).SingleOrDefault();
            if (dbSponsor == null)
                return false;

            dbSponsor.Name = s.Name;
            dbSponsor.CityStateZip = s.CityStateZip ?? string.Empty;
            dbSponsor.Description = s.Description ?? string.Empty;
            dbSponsor.EMail = s.EMail ?? string.Empty;
            dbSponsor.Fax = s.Fax ?? string.Empty;
            dbSponsor.Phone = s.Phone ?? string.Empty;
            dbSponsor.StreetAddress = s.StreetAddress ?? string.Empty;
            dbSponsor.WebSite = s.Website ?? string.Empty;
            if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
            {
                dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
            }

            db.SubmitChanges();

            return true;
        }

		static public long AddMemberBusiness(Sponsor s)
		{
            DB db = DBConnection.GetContext();

            var dbSponsor = (from mb in db.MemberBusinesses
                             where mb.ContactId == s.ContactId
                             select mb).SingleOrDefault();
            if (dbSponsor != null)
                return 0;

            dbSponsor = new SportsManager.Model.MemberBusiness();
            dbSponsor.ContactId = s.ContactId;
            dbSponsor.Name = s.Name;
            dbSponsor.CityStateZip = s.CityStateZip ?? string.Empty;
            dbSponsor.Description = s.Description ?? string.Empty;
            dbSponsor.EMail = s.EMail ?? string.Empty;
            dbSponsor.Fax = s.Fax ?? string.Empty;
            dbSponsor.Phone = s.Phone ?? string.Empty;
            dbSponsor.StreetAddress = s.StreetAddress ?? string.Empty;
            dbSponsor.WebSite = s.Website ?? string.Empty;
            if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
            {
                dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
            }

            db.MemberBusinesses.InsertOnSubmit(dbSponsor);
            db.SubmitChanges();

            s.Id = dbSponsor.Id;

            return s.Id;
		}

		static public async Task<bool> RemoveMemberBusiness(long accountId, long id)
		{
            DB db = DBConnection.GetContext();

            string userId = Globals.GetCurrentUserId();

            SportsManager.Model.MemberBusiness dbSponsor;

            if (DataAccess.Accounts.IsAccountAdmin(accountId, userId))
            {
                dbSponsor = (from mb in db.MemberBusinesses
                             where mb.Id == id
                             select mb).SingleOrDefault();
            }
            else
            {
                long contactId = DataAccess.Contacts.GetContactId(userId);

                dbSponsor = (from mb in db.MemberBusinesses
                             where mb.Id == id && mb.ContactId == contactId
                             select mb).SingleOrDefault();
            }

            if (dbSponsor != null)
            {
                db.MemberBusinesses.DeleteOnSubmit(dbSponsor);
                db.SubmitChanges();

                ModelObjects.Sponsor s = new Sponsor()
                {
                    Id = id,
                    AccountId = accountId
                };
                await Storage.Provider.DeleteFile(s.LogoURL);

                return true;
            }

            return false;
		}


	}
}
