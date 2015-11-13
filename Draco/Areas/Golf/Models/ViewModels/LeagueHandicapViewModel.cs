using System;
using System.Collections.Generic;
using SportsManager.Model;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels.Controllers
{
	public class LeagueHandicapViewModel : AccountViewModel
	{
		Dictionary<GolfRoster, Dictionary<DateTime, GolfScoreViewModel>> m_players = new Dictionary<GolfRoster, Dictionary<DateTime, GolfScoreViewModel>>();

		List<DateTime> m_allDates = new List<DateTime>();

		public LeagueHandicapViewModel(Controller c, long accountId, long flightId)
            : base(c, accountId)
		{
			DateTime curDate = DateTime.MaxValue;

			// get match scores ordered by Date.
			IEnumerable<GolfMatchScore> matchScores = DataAccess.Golf.GolfMatches.GetCompletedMatchScores(flightId);

			foreach (var score in matchScores)
			{
				if (score.GolfScore.DatePlayed != curDate)
				{
					m_allDates.Add(score.GolfScore.DatePlayed);
					curDate = score.GolfScore.DatePlayed;
				}

				if (!m_players.ContainsKey(score.GolfRoster))
				{
					m_players[score.GolfRoster] = new Dictionary<DateTime, GolfScoreViewModel>();
				}

				m_players[score.GolfRoster][curDate] = new GolfScoreViewModel(score.GolfScore, score.GolfRoster);
			}
		}

		public IEnumerable<DateTime> MatchDates
		{
			get { return m_allDates; }
		}

		public IEnumerable<PlayerViewModel> GetPlayers()
		{
			List<PlayerViewModel> players = new List<PlayerViewModel>();

			foreach (var player in m_players.Keys)
			{
				players.Add(new PlayerViewModel(player));
			}

			return players;
		}

		public IEnumerable<GolfScoreViewModel> GetScoresByDate(DateTime date)
		{
			List<GolfScoreViewModel> playerScoreList = new List<GolfScoreViewModel>();

			foreach (var playerScores in m_players)
			{
				if (playerScores.Value.ContainsKey(date))
					playerScoreList.Add(playerScores.Value[date]);
				else
					playerScoreList.Add(null);
			}

			return playerScoreList;
		}
	}
}