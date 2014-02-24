using System.Web.Mvc;
using System.Linq;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels
{
    public class PhotoGalleryViewModel : AccountViewModel
    {
        public PhotoGalleryViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsTeamEdit = true;

            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return;

            HasPhotos = DataAccess.PhotoGallery.GetTeamPhotos(team.TeamId).Any();

            // account admins can edit team photos, team admins, and team photo admins can as well.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId) || DataAccess.Teams.IsTeamPhotoAdmin(accountId, teamSeasonId);
            }
        }

        public PhotoGalleryViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            IsTeamEdit = false;

            HasPhotos = DataAccess.PhotoGallery.GetPhotos(accountId).Any();
        }

        public bool HasPhotos { get; private set; }

        public bool IsTeamEdit { get; private set; }

    }
}