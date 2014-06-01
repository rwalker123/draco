using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeadersViewModel : AccountViewModel
    {
        public LeadersViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;
        }

        public LeadersViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            var seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            Leagues = DataAccess.Leagues.GetLeagues(seasonId);
        }

        public long TeamSeasonId { get; private set; }
        public IQueryable<League> Leagues { get; private set; }
    }
}
