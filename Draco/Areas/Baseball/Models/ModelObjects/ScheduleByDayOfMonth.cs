using System;
using System.Collections.Generic;

namespace ModelObjects
{
    public class ScheduleByDayOfMonth
    {
        DateTime m_date;
        private List<Game> m_games = new List<Game>();
        private List<LeagueEvent> m_events = new List<LeagueEvent>();

        public ScheduleByDayOfMonth(DateTime date)
        {
            m_date = date;
        }

        public DateTime Date
        {
            get { return m_date; }
            set { m_date = value; }
        }

        public List<ModelObjects.Game> Games
        {
            get { return m_games; }
        }

        public List<ModelObjects.LeagueEvent> Events
        {
            get { return m_events; }
        }

        public void AddGame(ModelObjects.Game g)
        {
            m_games.Add(g);
        }

        public void AddEvent(ModelObjects.LeagueEvent e)
        {
            m_events.Add(e);
        }
    }
}