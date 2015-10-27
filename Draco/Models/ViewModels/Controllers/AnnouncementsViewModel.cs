using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class AnnouncementsViewModel : AccountViewModel
    {
        public AnnouncementsViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = c.IsTeamAdmin(accountId, teamSeasonId);
            }

            HasAnnouncements = false;

            var teamSeason = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason != null)
                HasAnnouncements = teamSeason.Team.TeamNews.Any(); 
        }

        public AnnouncementsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            HasAnnouncements = c.Db.LeagueNews.Where(ln => ln.AccountId == accountId).Any();
        }

        public bool HasAnnouncements
        {
            get;
            private set;
        }
    }
}