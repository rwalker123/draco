using System;

namespace SportsManager.ViewModels.API
{
    public class DivisionViewModel
    {
        public long Id { get; set; }
        public long DivisionId { get; set; }
        public long LeagueSeasonId { get; set; }
        public int Priority { get; set; }
        public String Name { get; set; }
        public long AccountId { get; set; }
    }
}