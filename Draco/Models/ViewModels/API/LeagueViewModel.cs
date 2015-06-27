using System;

namespace SportsManager.ViewModels.API
{
    public class LeagueViewModel
    {
        public long Id { get; set; }
        public long LeagueId { get; set; }
        public long SeasonId { get; set; }
        public String Name { get; set; }
        public long AccountId { get; set; }
    }
}