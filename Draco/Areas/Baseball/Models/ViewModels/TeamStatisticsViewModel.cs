using ModelObjects;
using SportsManager.ViewModels;
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
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            SeasonId = seasonId;
            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            CompletedGames = DataAccess.Schedule.GetTeamCompletedGames(teamSeasonId);
        }

        public bool IsTeamAdmin { get; private set; }
        public ModelObjects.Team Team { get; private set; }
        public long SeasonId { get; private set; }

        public IQueryable<Game> CompletedGames { get; private set; }
    }
}