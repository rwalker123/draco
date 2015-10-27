using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class UpcomingGamesViewModel : AccountViewModel
    {
        public UpcomingGamesViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (Team != null)
                Games = c.GetTeamIncompleteGames(teamSeasonId).Take(5);
        }

        public TeamSeason Team { get; private set; }
        public IQueryable<Game> Games { get; private set; }

        public string FieldName(Game g)
        {
            return g.AvailableField?.Name;
        }
    }
}
