using DataAccess.Baseball;
using ModelObjects;
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
        public IEnumerable<SelectListItem> GetBaseballLeagues()
        {
            List<SelectListItem> items = new List<SelectListItem>();

            IQueryable<Account> baseballLeagues = BaseballLeagues.GetBaseballLeagues();

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