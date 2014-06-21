using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Sponsors
    /// </summary>
	static public class Sponsors
	{
		static public IQueryable<Sponsor> GetSponsors( long accountId )
		{
            DB db = DBConnection.GetContext();
            return (from s in db.Sponsors
                    where s.AccountId == accountId && s.TeamId == 0
                    select new Sponsor()
                    {
                        Id = s.Id,
                        AccountId = accountId,
                        CityStateZip = s.CityStateZip,
                        Description = s.Description,
                        EMail = s.EMail,
                        Fax = s.Fax,
                        Phone = s.Phone,
                        StreetAddress = s.StreetAddress,
                        Name = s.Name,
                        Website = s.WebSite,
                        TeamId = s.TeamId
                    });
		}

		static public Sponsor GetSponsor(long id)
		{
            DB db = DBConnection.GetContext();

            return (from s in db.Sponsors
                    where s.Id == id
                    select new Sponsor()
                    {
                        Id = s.Id,
                        AccountId = s.AccountId,
                        CityStateZip = s.CityStateZip,
                        Description = s.Description,
                        EMail = s.EMail,
                        Fax = s.Fax,
                        Phone = s.Phone,
                        StreetAddress = s.StreetAddress,
                        Name = s.Name,
                        Website = s.WebSite,
                        TeamId = s.TeamId
                    }).SingleOrDefault();
		}

		static public bool ModifySponsor(Sponsor s)
		{
            if (String.IsNullOrEmpty(s.Name))
                return false;

            DB db = DBConnection.GetContext();

            SportsManager.Model.Sponsor dbSponsor = (from sp in db.Sponsors
                                                     where sp.Id == s.Id
                                                     select sp).SingleOrDefault();
            if (dbSponsor == null)
                return false;

            dbSponsor.AccountId = s.AccountId;
            dbSponsor.Description = s.Description ?? String.Empty;
            dbSponsor.Name = s.Name;
            dbSponsor.EMail = s.EMail ?? String.Empty;
            dbSponsor.Fax = s.Fax ?? String.Empty;
            dbSponsor.CityStateZip = s.CityStateZip ?? String.Empty;
            dbSponsor.Phone = s.Phone ?? String.Empty;
            dbSponsor.StreetAddress = s.StreetAddress ?? String.Empty;
            dbSponsor.TeamId = s.TeamId;
            dbSponsor.WebSite = s.Website ?? String.Empty;
            if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
            {
                dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
            }

            db.SubmitChanges();
            return true;

        }

		static public long AddSponsor(Sponsor s)
		{
            if (String.IsNullOrEmpty(s.Name))
                return 0;

            DB db = DBConnection.GetContext();

            SportsManager.Model.Sponsor dbSponsor = new SportsManager.Model.Sponsor()
            {
                AccountId = s.AccountId,
                Description = s.Description ?? String.Empty,
                Name = s.Name,
                EMail = s.EMail ?? String.Empty,
                Fax = s.Fax ?? String.Empty,
                CityStateZip = s.CityStateZip ?? String.Empty,
                Phone = s.Phone ?? String.Empty,
                StreetAddress = s.StreetAddress ?? String.Empty,
                TeamId = s.TeamId,
                WebSite = s.Website ?? String.Empty
            };

            if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
            {
                dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
            }

            db.Sponsors.InsertOnSubmit(dbSponsor);
            db.SubmitChanges();

            s.Id = dbSponsor.Id;
            s.AccountId = dbSponsor.AccountId;
            s.Description = dbSponsor.Description;
            s.Name = dbSponsor.Name;
            s.EMail = dbSponsor.EMail;
            s.Fax = dbSponsor.Fax;
            s.CityStateZip = dbSponsor.CityStateZip;
            s.Phone = dbSponsor.Phone;
            s.StreetAddress = dbSponsor.StreetAddress;
            s.TeamId = dbSponsor.TeamId;
            s.Website = dbSponsor.WebSite;

            return s.Id;
		}

		static public async Task<bool> RemoveSponsor(long id)
		{
            DB db = DBConnection.GetContext();

            var dbSponsor = (from s in db.Sponsors
                             where s.Id == id
                             select s).SingleOrDefault();

            if (dbSponsor != null)
            {
                db.Sponsors.DeleteOnSubmit(dbSponsor);
                db.SubmitChanges();

                var sponsor = new Sponsor()
                {
                    Id = dbSponsor.Id,
                    AccountId = dbSponsor.AccountId,
                    TeamId = dbSponsor.TeamId
                };

                if (sponsor.LogoURL != null)
                {
                    await Storage.Provider.DeleteDirectory(sponsor.SponsorsDir);
                }

                return true;
            }

            return false;
		}

        static public IQueryable<Sponsor> GetTeamSponsors(long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            var teamId = (from ts in db.TeamsSeasons
                          where ts.Id == teamSeasonId
                          select ts.TeamId).SingleOrDefault();

            return (from s in db.Sponsors
                    where s.TeamId == teamId
                    select new Sponsor()
                    {
                        Id = s.Id,
                        AccountId = s.AccountId,
                        CityStateZip = s.CityStateZip,
                        Description = s.Description,
                        EMail = s.EMail,
                        Fax = s.Fax,
                        Phone = s.Phone,
                        StreetAddress = s.StreetAddress,
                        Name = s.Name,
                        Website = s.WebSite,
                        TeamId = s.TeamId
                    });
        }

    }
}