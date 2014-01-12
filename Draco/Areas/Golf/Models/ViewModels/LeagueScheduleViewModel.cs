using Microsoft.AspNet.Identity;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
    public class LeagueScheduleViewModel
    {
        public LeagueScheduleViewModel(long accountId, long flightId)
        {
            IEnumerable<GolfMatch> completedMatches = DataAccess.Golf.GolfMatches.GetCompletedMatches(flightId);

            CompletedMatches = (from cm in completedMatches
                                select new GolfMatchViewModel(cm));

            IEnumerable<GolfMatch> upcomingMatches = DataAccess.Golf.GolfMatches.GetNotCompletedMatches(flightId);

            UpcomingMatches = (from um in upcomingMatches
                               select new GolfMatchViewModel(um));

            AccountId = accountId;
            FlightId = flightId;
        }

        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }
        public IEnumerable<GolfMatchViewModel> UpcomingMatches { get; private set; }

        private long AccountId { get; set; }
        private long FlightId { get; set; }

        public bool IsAdmin()
        {
            return DataAccess.Accounts.IsAccountAdmin(AccountId, HttpContext.Current.User.Identity.GetUserId());
        }
    }

}