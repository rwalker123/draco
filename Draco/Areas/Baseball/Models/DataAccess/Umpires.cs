using System;
using System.Collections.Generic;
using System.Linq;
using ModelObjects;
using SportsManager;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Umpires
    /// </summary>
    static public class Umpires
    {
        static public bool RemoveUmpire(long id)
        {
            DB db = DBConnection.GetContext();
            var dbUmp = (from u in db.LeagueUmpires
                         where u.id == id
                         select u).SingleOrDefault();
            if (dbUmp != null)
            {
                db.LeagueUmpires.DeleteOnSubmit(dbUmp);
                db.SubmitChanges();
                return true;
            }

            return false;
        }

        static public IQueryable<Umpire> GetUmpires(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from u in db.LeagueUmpires
                    where u.AccountId == accountId
                    orderby u.Contact.LastName, u.Contact.FirstName, u.Contact.MiddleName
                    select new Umpire()
                    {
                        Id = u.id,
                        AccountId = accountId,
                        ContactId = u.ContactId,
                        FirstName = u.Contact.FirstName,
                        LastName = u.Contact.LastName,
                        MiddleName = u.Contact.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(u.ContactId)
                    });
        }

        static public Umpire GetUmpire(long id)
        {
            DB db = DBConnection.GetContext();
            return (from u in db.LeagueUmpires
                    where u.id == id
                    select new Umpire()
                    {
                        Id = u.id,
                        AccountId = u.AccountId,
                        ContactId = u.ContactId,
                        FirstName = u.Contact.FirstName,
                        LastName = u.Contact.LastName,
                        MiddleName = u.Contact.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(u.ContactId)
                    }).SingleOrDefault();
        }

        static public long AddUmpire(long accountId, long contactId)
        {
            if (accountId <= 0)
                return 0;

            DB db = DBConnection.GetContext();
            SportsManager.Model.LeagueUmpire dbUmp = new SportsManager.Model.LeagueUmpire();
            dbUmp.AccountId = accountId;
            dbUmp.ContactId = (int)contactId;

            db.LeagueUmpires.InsertOnSubmit(dbUmp);
            db.SubmitChanges();

            return dbUmp.id;
        }


        static public IQueryable<ContactName> GetAvailableUmpires(long accountId, string firstName, string lastName)
        {
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from lu in db.LeagueUmpires
                        select lu.ContactId);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) &&
                    !cIds.Contains(c.Id) &&
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new ContactName()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        MiddleName = c.MiddleName,
                        LastName = c.LastName,
                        PhotoURL = Contact.GetPhotoURL(c.Id)
                    });
        }

        static public IEnumerable<ContactName> GetUmpiresFromGame(Game g)
        {
            List<ContactName> c = new List<ContactName>();

            Umpire ump = GetUmpire(g.Umpire1);
            if (ump != null)
                c.Add(ump);

            ump = GetUmpire(g.Umpire2);
            if (ump != null)
                c.Add(ump);

            ump = GetUmpire(g.Umpire3);
            if (ump != null)
                c.Add(ump);

            ump = GetUmpire(g.Umpire4);
            if (ump != null)
                c.Add(ump);

            return c;
        }
    }
}