using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;

namespace SportsManager.Baseball.ViewModels.API
{
    public class DivisionSetupViewModel
    {
        public long Id { get; set; }
        public long DivisionDefId { get; set; }
        public String Name { get; set; }
        public int Priority { get; set; }
        public long LeagueSeasonId { get; set; }
        public long AccountId { get; set; }
        public IEnumerable<TeamViewModel> Teams { get; set; }
    }
}