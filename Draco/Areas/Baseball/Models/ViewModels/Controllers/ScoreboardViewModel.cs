using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class ScoreboardViewModel : AccountViewModel
    {
        public ScoreboardViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Init();
        }

        public ScoreboardViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            TeamAdmin = c.GetTeamsAsAdmin(AccountId, HttpContext.Current.User.Identity.Name);
            Init();
        }

        private void Init()
        {
            var trackGamesPlayed = false;
            bool.TryParse(Controller.GetAccountSetting(AccountId, "TrackGamesPlayed"), out trackGamesPlayed);
            TrackGamesPlayed = trackGamesPlayed;

            ShowTweetResults = !String.IsNullOrEmpty(Account.TwitterAccountName);
        }

        /// <summary>
        /// list of team season ids for which the current user is an admin.
        /// </summary>
        public IQueryable<long> TeamAdmin
        {
            get;
            private set;
        }

        public bool ShowTweetResults { get; private set; }
        public bool TrackGamesPlayed { get; private set; }

    }
}