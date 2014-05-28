using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamScheduleViewModel : AccountViewModel
    {
        public TeamScheduleViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (Team != null)
            {
                Games = DataAccess.Schedule.GetTeamSchedule(teamSeasonId);
            }
        }

        public Team Team { get; set; }
        public IQueryable<Game> Games { get; set; }
    }
}