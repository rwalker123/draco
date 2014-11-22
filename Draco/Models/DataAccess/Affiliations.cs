using ModelObjects;
using SportsManager;
using System;
using System.Linq;


namespace DataAccess
{
	/// <summary>
	/// Summary description for Affiliations
	/// </summary>
	static public class Affiliations
	{
		static public IQueryable<Affiliation> GetAffiliations()
		{
            DB db = DBConnection.GetContext();
            return (from a in db.Affiliations
                    select new Affiliation(a.Id, a.Name));
		}

		static public bool IsValidName(string organizationName)
		{
			bool validOrganizationName = true;

			// remove all spaces from names and then do a case insensitive
			// compare.
			string compareOrganization = organizationName.ToLower();

			compareOrganization = compareOrganization.Replace(" ", String.Empty);

			var organizations = GetAffiliations();
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
            DB db = DBConnection.GetContext();

            var dbAff = (from a in db.Affiliations
                         where a.Id == affiliation.Id
                         select a).SingleOrDefault();
            if (dbAff == null)
                return false;

            dbAff.Name = affiliation.Name;
            db.SubmitChanges();

            return true;
		}

		static public bool AddAffiliation(Affiliation affiliation)
		{
            DB db = DBConnection.GetContext();

            var dbAff = new SportsManager.Model.Affiliation()
            {
                Name = affiliation.Name
            };

            db.Affiliations.InsertOnSubmit(dbAff);
            db.SubmitChanges();

            affiliation.Id = dbAff.Id;
            return true;
        }

		static public bool RemoveAffiliation(Affiliation affiliation)
		{
            DB db = DBConnection.GetContext();

            var dbAff = (from a in db.Affiliations
                         where a.Id == affiliation.Id
                         select a).SingleOrDefault();
            if (dbAff == null)
                return false;

            db.Affiliations.DeleteOnSubmit(dbAff);
            db.SubmitChanges();

            return true;
        }

		static public string GetAffiliationNameFromId(long id)
		{
            DB db = DBConnection.GetContext();

            return (from a in db.Affiliations
                    where a.Id == id
                    select a.Name).SingleOrDefault();
		}
	}
}