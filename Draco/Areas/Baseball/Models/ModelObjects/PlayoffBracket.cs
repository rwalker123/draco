using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace ModelObjects
{
    public class PlayoffBracket
    {
        private long m_id = 0;
        private long m_playoffId = 0;

        private int m_gameNo = 0;
        private int m_roundNo = 0;

        private long m_team1Id = 0;
        private string m_team1IdType = "SEED"; // SEED, GAME, BYE
        private long m_team2Id = 0;
        private string m_team2IdType = "SEED";

        private int m_numGamesInSeries = 0;

        List<PlayoffGame> m_games;

        public PlayoffBracket()
        {
        }

        public PlayoffBracket(long id, long playoffId, long team1Id, string team1IdType,
                                long team2Id, string team2IdType, int gameNo, int roundNo,
                                int numGamesInSeries)
        {
            m_id = id;
            m_playoffId = playoffId;
            m_team1Id = team1Id;
            m_team1IdType = team1IdType;
            m_team2Id = team2Id;
            m_team2IdType = team2IdType;
            m_gameNo = gameNo;
            m_roundNo = roundNo;
            m_numGamesInSeries = numGamesInSeries;
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

        public long Team1Id
        {
            get
            {
                return m_team1Id;
            }

            set
            {
                m_team1Id = value;
            }
        }

        public string Team1IdType
        {
            get
            {
                return m_team1IdType;
            }

            set
            {
                m_team1IdType = value;
            }
        }

        public string Team1Name
        {
            get
            {
                return GetTeamName(m_team1IdType, m_team1Id, -1, true);
            }

            set
            {
            }
        }

        public long Team2Id
        {
            get
            {
                return m_team2Id;
            }

            set
            {
                m_team2Id = value;
            }
        }

        public string Team2IdType
        {
            get
            {
                return m_team2IdType;
            }

            set
            {
                m_team2IdType = value;
            }
        }

        public string Team2Name
        {
            get
            {
                return GetTeamName(m_team2IdType, m_team2Id, 0, false);
            }

            set
            {
            }
        }

        public int GameNo
        {
            get
            {
                return m_gameNo;
            }

            set
            {
                m_gameNo = value;
            }
        }

        public int RoundNo
        {
            get
            {
                return m_roundNo;
            }

            set
            {
                m_roundNo = value;
            }
        }

        public int NumGamesInSeries
        {
            get
            {
                return m_numGamesInSeries;
            }

            set
            {
                m_numGamesInSeries = value;
            }
        }

        public string WinningTeamName
        {
            get
            {
                Team t = DataAccess.Playoffs.GetBracketWinner(m_playoffId, m_roundNo, m_gameNo);
                if (t != null)
                    return t.Name;

                return String.Empty;
            }

            set { }

        }

        public List<PlayoffGame> Games
        {
            get { return m_games; }
            set { m_games = value; }
        }

        private string GetTeamName(string idType, long teamId, int modifier, bool isHomeTeam)
        {
            string teamName = String.Empty;


            if (idType == "SEED")
            {
                var seeds = DataAccess.Playoffs.GetPlayoffSeeds(m_playoffId);
                foreach (PlayoffSeed s in seeds)
                {
                    if (s.SeedNo == teamId)
                    {
                        teamName = s.TeamName;
                        break;
                    }
                }

                if (String.IsNullOrEmpty(teamName))
                    teamName = "Seed #" + teamId.ToString();
            }
            else if (idType == "BYE")
            {
                teamName = "Bye";
            }
            else if (idType == "GAME")
            {
                int prevRoundNo = RoundNo - 1;
                int prevGameNo = GameNo * 2 + modifier;
                ModelObjects.Team t = DataAccess.Playoffs.GetBracketWinner(m_playoffId, RoundNo - 1, prevGameNo);
                if (t != null)
                    teamName = t.Name;
            }

            return teamName;
        }
    }
}
