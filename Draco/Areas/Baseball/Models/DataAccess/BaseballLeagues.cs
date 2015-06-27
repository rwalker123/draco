using ModelObjects;
using System.Linq;

namespace DataAccess.Baseball
{
    static public class BaseballLeagues
    {
        static public IQueryable<Account> GetBaseballLeagues()
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.AccountTypeId == 1
                    select a);
        }
    }
}