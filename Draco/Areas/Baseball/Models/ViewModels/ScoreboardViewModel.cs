using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class ScoreboardViewModel : AccountViewModel
    {
        public ScoreboardViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Init();
        }

        public ScoreboardViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            TeamAdmin = DataAccess.Teams.GetTeamsAsAdmin(AccountId, HttpContext.Current.User.Identity.Name);
            Init();
        }

        private void Init()
        {
            var trackGamesPlayed = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(AccountId, "TrackGamesPlayed"), out trackGamesPlayed);
            TrackGamesPlayed = trackGamesPlayed;

            ShowTweetResults = !String.IsNullOrEmpty(DataAccess.SocialIntegration.Twitter.TwitterAccountName(AccountId));
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