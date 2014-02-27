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
            TodayGames = DataAccess.Schedule.GetScoreboard(AccountId, DateTime.Today);
            DateTime yesterday = DateTime.Today.AddDays(-1.0);
            YesterdayGames = DataAccess.Schedule.GetScoreboard(AccountId, yesterday);

            DateTime curDay = yesterday.AddDays(-1.0);
            List<ModelObjects.Game> prevGames = new List<ModelObjects.Game>();
            for (int i = 0; i < 3; i++)
            {
                prevGames.AddRange(DataAccess.Schedule.GetScoreboard(AccountId, curDay));
                curDay = curDay.AddDays(-1.0);
            }

            GameSummaries = (from g in prevGames
                             where DataAccess.GameStats.HasGameRecap(g.Id)
                             select g).AsQueryable();

            HasGames = TodayGames.Any() || YesterdayGames.Any() || GameSummaries.Any();

            TeamAdmin = DataAccess.Teams.GetTeamsAsAdmin(AccountId, HttpContext.Current.User.Identity.Name);
        }

        public bool HasGames
        {
            get;
            private set;
        }

        public IQueryable<ModelObjects.Game> TodayGames
        {
            get;
            private set;
        }

        public IQueryable<ModelObjects.Game> YesterdayGames
        {
            get;
            private set;
        }

        public IQueryable<ModelObjects.Game> GameSummaries
        {
            get;
            private set;
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