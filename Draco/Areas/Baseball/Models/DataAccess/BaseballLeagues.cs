using System;
using System.Collections.Generic;
using System.Linq;
using SportsManager.Model;
using SportsManager;

namespace DataAccess.Baseball
{
    static public class BaseballLeagues
    {
        static public IEnumerable<Account> GetBaseballLeagues()
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.AccountTypeId == 1
                    select a);
        }
    }
}