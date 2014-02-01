using System.Collections.Generic;
using ModelObjects;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class ScheduleViewModel : AccountViewModel
    {
        public ScheduleViewModel(Controller c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;

            Leagues = DataAccess.Leagues.GetLeagues(seasonId);
        }

        public long SeasonId { get; private set; }

        public IEnumerable<League> Leagues
        {
            get;
            private set;
        }
    }
}