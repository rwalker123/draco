using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Linq;
using SportsManager;
using System.Threading.Tasks;

namespace DataAccess
{
	/// <summary>
	/// Summary description for AccountHandouts
	/// </summary>
	static public class AccountHandouts
	{
		static private AccountHandout CreateHandout(SqlDataReader dr)
		{
			return new AccountHandout(dr.GetInt64(0), dr.GetString(1), dr.GetString(2), dr.GetInt64(3));
		}

		static public AccountHandout GetHandout(long id)
		{
            DB db = DBConnection.GetContext();
            return (from h in db.AccountHandouts
                    where h.Id == id
                    select new AccountHandout()
                    {
                        Id = h.Id,
                        ReferenceId = h.AccountId,
                        Description = h.Description,
                        FileName = h.FileName
                    }).SingleOrDefault();
		}

		static public IQueryable<AccountHandout> GetAccountHandouts(long accountId)
		{
            DB db = DBConnection.GetContext();

            var x = (from ah in db.AccountHandouts
                     where ah.AccountId == accountId
                     orderby ah.Id descending
                     select new AccountHandout()
                     {
                         Id = ah.Id,
                         ReferenceId = ah.AccountId,
                         Description = ah.Description,
                         FileName = ah.FileName
                     });

            return x;
		}

		static public bool ModifyAccountHandout(AccountHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbHandout = (from h in db.AccountHandouts
                             where h.Id == item.Id
                             select h).SingleOrDefault();
            if (dbHandout != null)
            {
                dbHandout.Description = item.Description;
                dbHandout.FileName = item.FileName;

                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public bool AddAccountHandout(AccountHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbHandout = new SportsManager.Model.AccountHandout()
            {
                AccountId = item.ReferenceId,
                Description = item.Description,
                FileName = item.FileName
            };

            db.AccountHandouts.InsertOnSubmit(dbHandout);
            db.SubmitChanges();

            item.Id = dbHandout.Id;

            return true;
		}

		static public async Task<bool> RemoveAccountHandout(AccountHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbHandout = (from h in db.AccountHandouts
                             where h.Id == item.Id
                             select h).SingleOrDefault();
            if (dbHandout != null)
            {
                db.AccountHandouts.DeleteOnSubmit(dbHandout);
                db.SubmitChanges();

                item.FileName = dbHandout.FileName;

                await SportsManager.Models.Utils.AzureStorageUtils.RemoveCloudFile(item.HandoutURL);
                return true;
            }

            return false;
		}
	}
}
