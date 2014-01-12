using Microsoft.AspNet.Identity;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
    public class CompletedMatchViewModel
    {
        public CompletedMatchViewModel(long accountId, long seasonId, long flightId)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            FlightId = flightId;

            GolfMatch recentMatch = DataAccess.Golf.GolfMatches.GetMostRecentCompleted(flightId);

            IEnumerable<GolfMatch> matches = DataAccess.Golf.GolfMatches.GetCompletedMatchesRegularSeason(flightId, recentMatch.MatchDate);
            CompletedMatches = (from m in matches
                                select new GolfMatchViewModel(m));

            if (recentMatch != null)
                LeagueMatchResults = new LeagueMatchResultsViewModel(accountId, flightId, recentMatch.MatchDate);
        }

        public long AccountId { get; private set; }
        public long SeasonId { get; private set; }
        public long FlightId { get; private set; }

        public bool IsAdmin()
        {
            return DataAccess.Accounts.IsAccountAdmin(AccountId, HttpContext.Current.User.Identity.GetUserId());
        }

        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }
        public LeagueMatchResultsViewModel LeagueMatchResults { get; private set; }
    }
}