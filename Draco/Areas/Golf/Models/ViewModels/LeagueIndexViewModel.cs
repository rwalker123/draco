using System.Collections.Generic;
using System.Web.Mvc;
using DataAccess.Golf;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{

    public class LeagueIndexViewModel
    {
        public IEnumerable<SelectListItem> GetGolfLeagues()
        {
            List<SelectListItem> items = new List<SelectListItem>();

            IEnumerable<Account> golfLeagues = GolfLeagues.GetGolfLeagues();

            foreach (Account a in golfLeagues)
            {
                items.Add(new SelectListItem() { Text = a.Name, Value = a.Id.ToString() });
            }

            return items;
        }

    }

}