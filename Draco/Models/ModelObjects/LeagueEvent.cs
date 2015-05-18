using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for LeagueEvent
    /// </summary>
    public class LeagueEvent
    {
        public LeagueEvent()
        {
        }

        public long Id
        {
            get; 
            set;
        }

        public long LeagueSeasonId
        {
            get;
            set;
        }

        public DateTime EventDate
        {
            get;
            set;
        }

        public String Description
        {
            get;
            set;
        }
    }
}