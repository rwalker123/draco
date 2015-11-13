using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class TeamStatisticsViewModel : AccountViewModel
    {
        public TeamStatisticsViewModel(DBController c, long accountId, long teamSeasonId)
            : this(c, accountId, teamSeasonId, 0)
        {
        }

        public TeamStatisticsViewModel(DBController c, long accountId, long teamSeasonId, long seasonId)
            : base(c, accountId)
        {
            if (Account == null)
                return;

            SeasonId = seasonId;
            SeasonName = c.GetCurrentSeason(accountId)?.Name;
            IsTeamAdmin = c.IsTeamAdmin(accountId, teamSeasonId);
            Team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (Team == null)
                return;
            CompletedGames = c.GetTeamCompletedGames(Team.Id);

            TeamStanding = c.GetTeamStanding(teamSeasonId, CompletedGames);
        }

        public bool IsTeamAdmin { get; private set; }
        public TeamSeason Team { get; private set; }
        public long SeasonId { get; private set; }

        public IQueryable<Game> CompletedGames { get; private set; }

        public String SeasonName { get; private set; }

        public bool FromLeagueAccount
        {
            get { return AccountId != 0; }
        }

        public TeamStandingViewModel TeamStanding { get; private set; }
    }
}