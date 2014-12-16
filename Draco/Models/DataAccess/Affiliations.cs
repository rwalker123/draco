using ModelObjects;
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
                    select a);
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

            db.Affiliations.Attach(affiliation);
            db.Entry(affiliation).State = System.Data.Entity.EntityState.Modified;

            db.SaveChanges();

            return true;
		}

		static public bool AddAffiliation(Affiliation affiliation)
		{
            DB db = DBConnection.GetContext();

            db.Affiliations.Add(affiliation);
            db.SaveChanges();

            return true;
        }

		static public bool RemoveAffiliation(Affiliation affiliation)
		{
            DB db = DBConnection.GetContext();

            db.Affiliations.Remove(affiliation);
            db.SaveChanges();

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