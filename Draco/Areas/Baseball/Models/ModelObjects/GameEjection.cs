using System;
using System.Configuration;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for GameEjection
    /// </summary>
    public class GameEjection
    {
        private long m_id = 0;
        private long m_leagueSeasonId = 0;
        private long m_gameId = 0;
        private long m_umpireId = 0;
        private long m_playerSeasonId = 0;
        private string m_comments = string.Empty;


        public GameEjection()
        {
        }

        public GameEjection(long id, long leagueSeasonId, long gameId, long playerSeasonId, long umpireId, string comments)
        {
            m_id = id;
            m_leagueSeasonId = leagueSeasonId;
            m_gameId = gameId;
            m_umpireId = umpireId;
            m_playerSeasonId = playerSeasonId;
            m_comments = comments;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long LeagueSeasonId
        {
            get { return m_leagueSeasonId; }
            set { m_leagueSeasonId = value; }
        }

        public long GameId
        {
            get { return m_gameId; }
            set { m_gameId = value; }
        }

        public long UmpireId
        {
            get { return m_umpireId; }
            set { m_umpireId = value; }
        }

        public long PlayerSeasonId
        {
            get { return m_playerSeasonId; }
            set { m_playerSeasonId = value; }
        }

        public string Comments
        {
            get { return m_comments; }
            set { m_comments = value; }
        }
    }
}