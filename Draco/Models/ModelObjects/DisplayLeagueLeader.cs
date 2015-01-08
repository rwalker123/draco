using System;

namespace ModelObjects
{
    public class DisplayLeagueLeader
    {
        public String FieldName { get; set; }
        public long AccountId { get; set; }
        public long TeamId { get; set; }
        public bool IsBatLeader { get; set; }
    }
}