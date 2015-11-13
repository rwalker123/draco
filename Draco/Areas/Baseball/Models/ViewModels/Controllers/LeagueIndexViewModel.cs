using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    /// <summary>
    /// ViewModel for listing all the baseball accounts, used to select an account to go to.
    /// </summary>
    public class LeagueIndexViewModel 
    {
        DB m_db;

        public LeagueIndexViewModel(DBController c)
        {
            m_db = c.Db;
        }

        public IEnumerable<SelectListItem> GetBaseballLeagues()
        {
            List<SelectListItem> items = new List<SelectListItem>();

            IQueryable<Account> baseballLeagues = m_db.Accounts.Where(a => a.AccountTypeId == 1);
            foreach (var l in baseballLeagues)
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