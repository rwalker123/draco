using System;
using System.Collections.Generic;
using SportsManager.ViewModels;
using SportsManager.Golf.Models;
using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
	public class LeagueHandicapViewModel : AccountViewModel
	{
		Dictionary<GolfRoster, Dictionary<DateTime, GolfScoreViewModel>> m_players = new Dictionary<GolfRoster, Dictionary<DateTime, GolfScoreViewModel>>();

		List<DateTime> m_allDates = new List<DateTime>();

		public LeagueHandicapViewModel(DBController c, long accountId, long flightId)
            : base(c, accountId)
		{
			DateTime curDate = DateTime.MaxValue;

			// get match scores ordered by Date.
			IEnumerable<GolfMatchScore> matchScores = GetCompletedMatchScores(flightId);

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

				m_players[score.GolfRoster][curDate] = new GolfScoreViewModel(Controller, score.GolfScore, score.GolfRoster);
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
				players.Add(new PlayerViewModel(Controller.Db, player));
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

        private IQueryable<GolfMatchScore> GetCompletedMatchScores(long flightId)
        {
            return (from gm in Controller.Db.GolfMatches
                    join gms in Controller.Db.GolfMatchScores on gm.Id equals gms.MatchId
                    join gs in Controller.Db.GolfScores on gms.ScoreId equals gs.Id
                    where gm.LeagueId == flightId && gm.MatchStatus == 1
                    orderby gm.MatchDate
                    select gms);

        }

    }
}