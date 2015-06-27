using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class AnnouncementsViewModel : AccountViewModel
    {
        public AnnouncementsViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            }

            HasAnnouncements = DataAccess.TeamNews.GetTeamAnnouncements(teamSeasonId).Any();

        }

        public AnnouncementsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            HasAnnouncements = DataAccess.LeagueNews.GetAllNews(accountId).Any();
        }

        public bool HasAnnouncements
        {
            get;
            private set;
        }
    }
}