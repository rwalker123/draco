using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels.Controllers
{

    public class LeagueIndexViewModel
    {
        DB m_db;

        public LeagueIndexViewModel(DBController c)
        {
            m_db = c.Db;
        }

        public IEnumerable<SelectListItem> GetGolfLeagues()
        {
            List<SelectListItem> items = new List<SelectListItem>();

            IQueryable<Account> golfLeagues = m_db.Accounts.Where(a => a.AccountTypeId == 3);
            foreach (var l in golfLeagues)
            {
                if (l.AccountsURL.Any())
                {
                    items.Add(new SelectListItem() { Text = l.Name, Value = l.AccountsURL.First().URL });
                }
                else
                {
                    items.Add(new SelectListItem() { Text = l.Name, Value = l.Id.ToString() });
                }

            }

            return items;

        }

    }

}