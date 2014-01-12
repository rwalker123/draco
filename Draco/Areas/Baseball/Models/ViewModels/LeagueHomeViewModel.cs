using System;
using System.Linq;
using System.Web.Mvc;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueHomeViewModel : AccountViewModel
    {
        public LeagueHomeViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            SeasonName = DataAccess.Seasons.GetCurrentSeasonName(AccountId);
            FirstYear = (Account.FirstYear == 0) ? String.Empty : Account.FirstYear.ToString();
            YouTubeUserId = Account.YouTubeUserId; // "GoogleDevelopers";  // "lopPrnYe7Vgh6u_TYPFHmQ"; 
            ShowVideos = !String.IsNullOrEmpty(YouTubeUserId) || IsAdmin;
            ShowPhotoGallery = IsAdmin || DataAccess.PhotoGallery.GetPhotos(accountId).Any();
        }

        public bool ShowVideos
        {
            get;
            private set;
        }

        public bool ShowPhotoGallery
        {
            get;
            private set;
        }

        public string SeasonName
        {
            get;
            private set;
        }

        public string FirstYear
        {
            get;
            private set;
        }

        public string YouTubeUserId
        {
            get;
            private set;
        }
    }
}
