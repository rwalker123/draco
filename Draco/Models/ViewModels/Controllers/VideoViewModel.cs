using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class VideoViewModel : AccountViewModel
    {
        public VideoViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert from team season to team id.
            var team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return;

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = c.IsTeamAdmin(accountId, teamSeasonId);
            }

            if (!IsAdmin)
            {
                IsAdmin = c.IsPhotoAdmin(accountId, Globals.GetCurrentUserId());
            }
        }

        public VideoViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            if (!IsAdmin)
            {
                IsAdmin = c.IsPhotoAdmin(accountId, Globals.GetCurrentUserId());
            }
        }
    }
}