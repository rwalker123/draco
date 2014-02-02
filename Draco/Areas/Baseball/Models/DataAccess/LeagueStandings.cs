using System;
using System.Data;
using System.Collections;
using System.Collections.Generic;
using System.Data.SqlClient;
using ModelObjects;
using System.Web.SessionState;

namespace DataAccess
{
	/// <summary>
	/// Summary description for LeagueStandings
	/// </summary>
	static public class LeagueStandings
	{
		static public List<TeamStanding> GetLeagueStandings(long leagueId)
		{
			IEnumerable<Team> rsTeams = DataAccess.Teams.GetTeams(leagueId);

			Dictionary<long, TeamStanding> teams = new Dictionary<long, TeamStanding>();

			foreach (Team t in rsTeams)
			{
                if (t.DivisionId > 0)
				    teams.Add(t.Id, new TeamStanding(t.Id, t.DivisionId, t.Name));
			}

            List<Game> completedGames = DataAccess.Schedule.GetCompletedGames(leagueId);

			foreach (Game g in completedGames)
			{
				// only count regular season games
				if (g.GameType == 0)
				{
					TeamStanding homeTeam = (TeamStanding)teams[g.HomeTeamId];
					TeamStanding awayTeam = (TeamStanding)teams[g.AwayTeamId];

					homeTeam.AddGameResult(true, awayTeam, g.HomeScore, g.AwayScore, g.GameStatus);
					awayTeam.AddGameResult(false, homeTeam, g.HomeScore, g.AwayScore, g.GameStatus);
				}
			}

			List<TeamStanding> s = new List<TeamStanding>(teams.Values);
			s.Sort();

			return s;
		}
	}
}