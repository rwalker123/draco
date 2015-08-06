using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class HandoutsViewModel : AccountViewModel
    {
        public HandoutsViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert from team season to team id.
            var team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
            {
                HasHandouts = false;
                return;
            }
            Handouts = c.Db.TeamHandouts.Where(th => th.TeamId == team.TeamId);
            HasHandouts = Handouts.Any();

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = c.IsTeamAdmin(accountId, teamSeasonId);
            }
        }

        public HandoutsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            Handouts = c.Db.AccountHandouts.Where(ah => ah.AccountId == accountId);
            HasHandouts = Handouts.Any();
        }

        public bool HasHandouts
        {
            get;
            private set;
        }

        public IQueryable<Object> Handouts
        {
            get;
            private set;
        }
    }
}