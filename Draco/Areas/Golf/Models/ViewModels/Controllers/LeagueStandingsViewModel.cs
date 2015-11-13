using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
	public class LeagueStandingsViewModel : AccountViewModel
	{
		public LeagueStandingsViewModel(DBController c, long accountId, long seasonId, long flightId)
            : base(c, accountId)
		{
			// get all completed matches.
			IEnumerable<DateTime> matches = GetCompletedMatchesDateRegularSeason(flightId);

			Dictionary<long, List<TeamScore>> results = new Dictionary<long, List<TeamScore>>();

			// sort out completed matches by teamId.
			foreach (var match in matches)
			{
				var lmr = new LeagueMatchResultsViewModel(Controller, accountId, flightId, match);
				foreach (var ts in lmr.TeamScores)
				{
					if (!results.ContainsKey(ts.TeamId))
						results[ts.TeamId] = new List<TeamScore>();

					results[ts.TeamId].Add(ts);
				}
			}

			// add each teams points.
			List<TeamScore> totalResults = new List<TeamScore>();
			foreach (var r in results)
			{
				double matchPoints = 0.0;
				double strokePoints = 0.0;

				foreach (var ts in r.Value)
				{
					matchPoints += ts.MatchPoints;
					strokePoints += ts.StrokePoints;
				}

				totalResults.Add(new TeamScore(r.Value.First().TeamName, r.Key, matchPoints, 0) { StrokePoints = strokePoints });
			}

			totalResults.Sort(new TotalPointsComparer());

			TeamStandings = totalResults;
		}

		public IList<TeamScore> TeamStandings { get; private set; }

        private IQueryable<DateTime> GetCompletedMatchesDateRegularSeason(long flightId)
        {
            return (from gm in Controller.Db.GolfMatches
                    where gm.LeagueId == flightId && gm.MatchStatus == 1 && gm.MatchType == 0
                    select gm.MatchDate).Distinct();
        }

    }
}