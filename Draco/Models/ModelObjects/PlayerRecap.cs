using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ModelObjects
{
    public partial class PlayerRecap
    {
        public long PlayerId { get; set; }

        public long TeamId { get; set; }

        public long GameId { get; set; }

        public virtual Game LeagueSchedule { get; set; }

        public virtual TeamRosterSeason RosterSeason { get; set; }

        public virtual Team Team { get; set; }
    }
}