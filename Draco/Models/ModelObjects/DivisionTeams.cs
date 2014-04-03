using System;
using System.Collections.Generic;
using System.Linq;

namespace ModelObjects
{
    public class DivisionTeams
    {
        public long Id { get; set; }
        public long LeagueId { get; set; }
        public long AccountId { get; set; }
        public String Name { get; set; }
        public int Priority { get; set; }
        public IQueryable<Team> Teams { get; set; }
    }
}