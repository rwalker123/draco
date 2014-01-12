using DataAccess.Baseball;
using SportsManager.Model;
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

            IEnumerable<Account> baseballLeagues = BaseballLeagues.GetBaseballLeagues();

            return (from a in baseballLeagues
                    select new SelectListItem() { Text = a.Name, Value = a.Id.ToString() });
        }
    }
}