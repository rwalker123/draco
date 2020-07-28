using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class PhotoGalleryViewModel : AccountViewModel
    {
        public PhotoGalleryViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsTeamEdit = true;

            var team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return;

            HasPhotos = c.Db.PhotoGalleryAlbums.Where(pga => pga.TeamId == team.Team.Id).Select(pga => pga.Photos).Any();

            // account admins can edit team photos, team admins, and team photo admins can as well.
            if (!IsAdmin)
            {
                IsAdmin = c.IsTeamAdmin(accountId, teamSeasonId) || c.IsTeamPhotoAdmin(accountId, teamSeasonId) || c.IsPhotoAdmin(accountId, Globals.GetCurrentUserId());
            }
        }

        public PhotoGalleryViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            IsTeamEdit = false;

            HasPhotos = c.Db.PhotoGalleries.Where(pg => pg.AccountId == accountId).Any();
            if (!IsAdmin)
            {
                IsAdmin = c.IsPhotoAdmin(accountId, Globals.GetCurrentUserId());
            }
        }

        public bool HasPhotos { get; private set; }

        public bool IsTeamEdit { get; private set; }

        public bool IsPhotoAdmin { get; private set; }
    }
}