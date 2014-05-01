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
        }

        public ScoreboardViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            TeamAdmin = DataAccess.Teams.GetTeamsAsAdmin(AccountId, HttpContext.Current.User.Identity.Name);
        }

        /// <summary>
        /// list of team season ids for which the current user is an admin.
        /// </summary>
        public IQueryable<long> TeamAdmin
        {
            get;
            private set;
        }
    }
}