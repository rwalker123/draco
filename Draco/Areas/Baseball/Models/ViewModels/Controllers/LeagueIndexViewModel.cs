using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
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
                if (!String.IsNullOrEmpty(l.Url))
                {
                    string[] urls = l.Url.Split(new char[] { ';' });
                    if (urls.Length > 0)
                        items.Add(new SelectListItem() { Text = l.Name, Value = urls[0] });
                    else
                        items.Add(new SelectListItem() { Text = l.Name, Value = l.Id.ToString() });
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