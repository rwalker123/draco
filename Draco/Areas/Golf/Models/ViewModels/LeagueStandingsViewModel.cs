using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels
{
	public class LeagueStandingsViewModel 
	{
		public LeagueStandingsViewModel(long accountId, long seasonId, long flightId)
		{
			// get all completed matches.
			IEnumerable<DateTime> matches = DataAccess.Golf.GolfMatches.GetCompletedMatchesDateRegularSeason(flightId);

			Dictionary<long, List<TeamScore>> results = new Dictionary<long, List<TeamScore>>();

			// sort out completed matches by teamId.
			foreach (var match in matches)
			{
				var lmr = new LeagueMatchResultsViewModel(accountId, flightId, match);
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

				totalResults.Add(new TeamScore(r.Key, matchPoints, 0) { StrokePoints = strokePoints });
			}

			totalResults.Sort(new TotalPointsComparer());

			TeamStandings = totalResults;
		}

		public IList<TeamScore> TeamStandings { get; private set; }
	}
}