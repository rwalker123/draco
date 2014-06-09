using System.Collections.Generic;
using ModelObjects;
using SportsManager.ViewModels;
using System.Web.Mvc;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class ScheduleViewModel : AccountViewModel
    {
        public ScheduleViewModel(Controller c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;

            Leagues = DataAccess.Leagues.GetLeagues(seasonId);
            Fields = DataAccess.Fields.GetFields(accountId);
            Umpires = DataAccess.Umpires.GetUmpires(accountId);
        }

        public long SeasonId { get; private set; }

        public IQueryable<Umpire> Umpires
        {
            get;
            private set;
        }


        public IEnumerable<Field> Fields
        {
            get;
            private set;
        }

        public IEnumerable<League> Leagues
        {
            get;
            private set;
        }
    }
}