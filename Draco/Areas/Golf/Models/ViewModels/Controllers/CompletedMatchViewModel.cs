using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf.ViewModels
{
    public class CompletedMatchViewModel : AccountViewModel
    {
        public CompletedMatchViewModel(DBController c, long accountId, long seasonId, long flightId)
            : base(c, accountId)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            FlightId = flightId;

            var recentMatch = c.GetMostRecentCompleted(flightId);

            if (recentMatch != null)
            {
                IEnumerable<GolfMatch> matches = GetCompletedMatchesRegularSeason(flightId, recentMatch.MatchDate);
                CompletedMatches = (from m in matches
                                    select new GolfMatchViewModel(m));

                LeagueMatchResults = new LeagueMatchResultsViewModel(Controller, accountId, flightId, recentMatch.MatchDate);
            }
        }

        private IEnumerable<GolfMatch> GetCompletedMatchesRegularSeason(long flightId, DateTime onDate)
        {
            DB db = Controller.Db;

            return (from gm in db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchDate == onDate && gm.MatchStatus == 1 && gm.MatchType == 0
                    select gm);
        }

        public long SeasonId { get; private set; }
        public long FlightId { get; private set; }


        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }
        public LeagueMatchResultsViewModel LeagueMatchResults { get; private set; }
    }
}