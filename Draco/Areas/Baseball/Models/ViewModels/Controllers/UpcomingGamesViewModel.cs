using ModelObjects;
using SportsManager.ViewModels;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class UpcomingGamesViewModel : AccountViewModel
    {
        public UpcomingGamesViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (Team != null)
                Games = DataAccess.Schedule.GetTeamIncompleteGames(teamSeasonId).Take(5);
        }

        public Team Team { get; private set; }
        public IQueryable<Game> Games { get; private set; }
    }
}
