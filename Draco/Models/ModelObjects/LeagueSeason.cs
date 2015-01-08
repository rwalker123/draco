
namespace ModelObjects
{
    class LeagueSeason
    {
        public LeagueSeason()
        {
        }

        public long Id { get; set; }
        public long LeagueId { get; set; }
        public long SeasonId { get; set; }

        public virtual LeagueDefinition LeagueDefinition { get; set; }
    }
}
