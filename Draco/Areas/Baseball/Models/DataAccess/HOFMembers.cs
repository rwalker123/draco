using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{
/// <summary>
/// Summary description for HOFMembers
/// </summary>
	static public class HOFMembers
	{
        static public IQueryable<HOFClass> GetClassYears(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from hof in db.hofs
                    where hof.AccountId == accountId
                    orderby hof.YearInducted descending
                    group hof by hof.YearInducted into g
                    select new HOFClass()
                    {
                        Year = g.Key,
                        MemberCount = g.Count(),
                        Members = null
                    });
        }


        static public IQueryable<HOFMember> GetClassMembers(long accountId, long year)
        {
            DB db = DBConnection.GetContext();

            return (from h in db.hofs
                    join c in db.Contacts on h.ContactId equals c.Id
                    where h.AccountId == accountId && h.YearInducted == year
                    orderby c.LastName, c.FirstName
                    select new HOFMember()
                    {
                        Id = h.Id,
                        AccountId = accountId,
                        ContactId = h.ContactId,
                        Biography = h.Bio,
                        YearInducted = h.YearInducted,
                        Name = Contact.BuildFullName(c.FirstName, c.MiddleName, c.LastName),
                        PhotoURL = Contact.GetLargePhotoURL(c.Id)
                    });
        }


		static public IQueryable<HOFMember> GetMembers(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from h in db.hofs
                    join c in db.Contacts on h.ContactId equals c.Id
                    where h.AccountId == accountId
                    orderby c.LastName, c.FirstName
                    select new HOFMember()
                    {
                        Id = h.Id,
                        AccountId = accountId,
                        ContactId = h.ContactId,
                        Biography = h.Bio,
                        YearInducted = h.YearInducted,
                        Name = c.FirstName + " " + c.LastName,
                        PhotoURL = Contact.GetLargePhotoURL(c.Id)
                    });
		}

		static public HOFMember GetHOFMember(long id)
		{
            return null;
		}

		static public bool ModifyMember(HOFMember hofMember)
		{
            DB db = DBConnection.GetContext();

            var dbHof = (from hof in db.hofs
                         where hof.Id == hofMember.Id
                         select hof).SingleOrDefault();

            if (dbHof == null)
                return false;

            dbHof.Bio = hofMember.Biography ?? String.Empty;
            dbHof.YearInducted = hofMember.YearInducted;

            db.SubmitChanges();

            return true;
        }

		static public long AddMember(HOFMember h)
		{
            DB db = DBConnection.GetContext();

            bool isInHof = (from hof in db.hofs
                            where hof.AccountId == h.AccountId &&
                            hof.ContactId == h.ContactId
                            select hof).Any();
            // if contact is already in hof, don't add again.
            if (isInHof)
                return 0;

            var dbHof = new SportsManager.Model.hof();
            dbHof.AccountId = h.AccountId;
            dbHof.ContactId = h.ContactId;
            dbHof.Bio = h.Biography;
            dbHof.YearInducted = h.YearInducted;

            db.hofs.InsertOnSubmit(dbHof);
            db.SubmitChanges();

            return dbHof.Id;
		}
	
		static public bool RemoveMember(int id)
		{
            DB db = DBConnection.GetContext();

            var dbHOF = (from h in db.hofs
                         where h.Id == id
                         select h).SingleOrDefault();

            if (dbHOF != null)
            {
                db.hofs.DeleteOnSubmit(dbHOF);
                db.SubmitChanges();
                return true;
            }

            return false;
		}
	
		static public bool ModifyNomination(HOFNomination h)
		{
            return false;
		}

		static public bool AddNomination(HOFNomination h)
		{
            return false;
		}
	
		static public bool RemoveNomination(HOFNomination h)
		{
            return false;
		}
	
		static public List<HOFNomination> GetHOFNominees(long accountId)
		{
            return null;
		}

		static public IQueryable<Contact> GetAvailableHOFMembers(long accountId, String firstName, String lastName)
		{
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var hofIds = (from h in db.hofs
                          where h.AccountId == accountId
                          select h.ContactId);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) && !hofIds.Contains(c.Id) &&
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                                    c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                                    c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
		}

        public static HOFNominationSetup GetHOFNominationSetup(long accountId)
        {
            return null;
        }

        public static bool SetHOFNominationSetup(HOFNominationSetup hofSetup)
        {
            return false;
        }

    }
}