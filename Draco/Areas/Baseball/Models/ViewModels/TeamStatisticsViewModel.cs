using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamStatisticsViewModel : AccountViewModel
    {
        public TeamStatisticsViewModel(Controller c, long accountId, long teamSeasonId)
            : this(c, accountId, teamSeasonId, 0)
        {
        }

        public TeamStatisticsViewModel(Controller c, long accountId, long teamSeasonId, long seasonId)
            : base(c, accountId)
        {
            if (Account == null)
                return;

            SeasonId = seasonId;
            SeasonName = DataAccess.Seasons.GetSeasonName(CurrentSeasonId);
            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (Team == null)
                return;
            CompletedGames = DataAccess.Schedule.GetTeamCompletedGames(teamSeasonId);
            TeamStanding = DataAccess.Teams.GetTeamStanding(teamSeasonId);
        }

        public bool IsTeamAdmin { get; private set; }
        public ModelObjects.Team Team { get; private set; }
        public long SeasonId { get; private set; }

        public IQueryable<Game> CompletedGames { get; private set; }

        public String SeasonName { get; private set; }

        public bool FromLeagueAccount
        {
            get { return AccountId != 0; }
        }

        public TeamStanding TeamStanding { get; private set; }
    }
}