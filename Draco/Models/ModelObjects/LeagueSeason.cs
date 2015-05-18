using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
    public class LeagueSeason
    {
        public LeagueSeason()
        {
            Games = new Collection<Game>();
        }

        public long Id { get; set; }
        public long LeagueId { get; set; }
        public long SeasonId { get; set; }

        public virtual LeagueDefinition LeagueDefinition { get; set; }
        public virtual ICollection<Game> Games { get; set; }
    }
}
