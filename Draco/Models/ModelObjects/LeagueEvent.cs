using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for LeagueEvent
    /// </summary>
    public class LeagueEvent
    {
        private long m_id;
        private long m_leagueId;
        private DateTime m_eventDate;
        private string m_description;

        public LeagueEvent()
        {
            m_id = 0;
            m_leagueId = 0;
            m_eventDate = DateTime.Now;
            m_description = String.Empty;
        }

        public LeagueEvent(long id, long leagueSeasonId, DateTime eventDate, string description)
        {
            m_id = id;
            m_leagueId = leagueSeasonId;
            m_eventDate = eventDate;
            m_description = description;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long LeagueId
        {
            get { return m_leagueId; }
            set { m_leagueId = value; }
        }

        public DateTime EventDate
        {
            get { return m_eventDate; }
            set { m_eventDate = value; }
        }

        public String Description
        {
            get { return m_description; }
            set { m_description = value; }
        }
    }
}