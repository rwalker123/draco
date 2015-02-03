using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffGame
/// </summary>
	public class PlayoffGame
	{
		private long m_id = 0;
        private long m_playoffId = 0;
        private long m_bracketId = 0;
        
        private long m_fieldId = 0;
		private DateTime m_gameDate;
		private DateTime m_gameTime;

        private long m_gameId = 0;

        private int m_seriesGameNo = 1;

        private bool m_team1HomeTeam = true;

		public PlayoffGame()
		{
		}

		public PlayoffGame(long id, long bracketId, long fieldId, DateTime gameDate, DateTime gameTime,
                            long gameId, long playoffId, int seriesGameNo, bool team1HomeTeam)
		{
			m_id = id;
            m_playoffId = playoffId;
            m_bracketId = bracketId;
            
            m_fieldId = fieldId;
			
            m_gameDate = gameDate;
			m_gameTime = gameTime;

            m_gameId = gameId;

            m_team1HomeTeam = team1HomeTeam;
            m_seriesGameNo = seriesGameNo;
		}

		public long Id
		{
			get
			{
				return m_id;
			}

			set
			{
				m_id = value;
			}
		}

        public long PlayoffId
		{
			get
			{
				return m_playoffId;
			}

			set
			{
				m_playoffId = value;
			}
		}

        public long BracketId
        {
            get
            {
                return m_bracketId;
            }

            set
            {
                m_bracketId = value;
            }
        }

        public long FieldId
		{
			get
			{
				return m_fieldId;
			}

			set
			{
				m_fieldId = value;
			}
		}

        public string FieldName
        {
            get
            {
                return DataAccess.Fields.GetFieldName(m_fieldId);
            }
            set
            {

            }
        }

        public DateTime GameDate
		{
			get
			{
				return m_gameDate;
			}

			set
			{
				m_gameDate = value;
			}
		}

        public String GameDateNoTimeZone
        {
            get
            {
                return m_gameDate.ToShortDateString();
            }

            set
            {
            }
        }

        public DateTime GameTime
		{
			get
			{
				return m_gameTime;
			}

			set
			{
				m_gameTime = value;
			}
		}

        public String GameTimeNoTimeZone
        {
            get
            {
                return m_gameTime.ToShortTimeString();
            }

            set
            {
            }
        }

        public long GameId
		{
			get
			{
				return m_gameId;
			}

			set
			{
				m_gameId = value;
			}
		}

        public int SeriesGameNo
        {
            get { return m_seriesGameNo; }
            set { m_seriesGameNo = value; }
        }

        public bool Team1HomeTeam
        {
            get { return m_team1HomeTeam; }
            set { m_team1HomeTeam = value; }
        }


        public bool IsGameComplete
        {
            get 
            {
                if (GameId > 0)
                {
                    ModelObjects.Game game = DataAccess.Schedule.GetGame(GameId);
                    if (game != null && game.IsGameComplete)
                        return true;
                }

                return false;
            }

            set { }
        }

        public int Team1Score
        {
            get
            {
                if (GameId > 0)
                {
                    Game game = DataAccess.Schedule.GetGame(GameId);
                    if (game != null && game.IsGameComplete)
                    {
                        if (Team1HomeTeam)
                            return game.HomeScore;
                        else
                            return game.AwayScore;
                    }
                }

                return 0;
            }

            set { }
        }

        public int Team2Score
        {
            get
            {
                if (GameId > 0)
                {
                    Game game = DataAccess.Schedule.GetGame(GameId);
                    if (game != null && game.IsGameComplete)
                    {
                        if (Team1HomeTeam)
                            return game.AwayScore;
                        else
                            return game.HomeScore;
                    }
                }

                return 0;
            }

            set { }
        }
    }
}