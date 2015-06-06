using System;
using System.Collections.Generic;

namespace ModelObjects
{
    public class PlayoffBracket
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayoffId { get; set; } // PlayoffId
        public long Team1Id { get; set; } // Team1Id
        public string Team1IdType { get; set; } // Team1IdType
        public long Team2Id { get; set; } // Team2Id
        public string Team2IdType { get; set; } // Team2IdType
        public int GameNo { get; set; } // GameNo
        public int RoundNo { get; set; } // RoundNo
        public int NumGamesInSeries { get; set; } // NumGamesInSeries

        // Reverse navigation
        public virtual ICollection<PlayoffGame> PlayoffGames { get; set; } // PlayoffGame.FK_PlayoffGame_PlayoffGame

        // Foreign keys
        public virtual PlayoffSetup PlayoffSetup { get; set; } // FK_PlayoffBracket_PlayoffSetup

        public PlayoffBracket()
        {
            PlayoffGames = new List<PlayoffGame>();
        }

        public string Team1Name
        {
            get
            {
                return GetTeamName(Team1IdType, Team1Id, -1, true);
            }

            set
            {
            }
        }

        public string Team2Name
        {
            get
            {
                return GetTeamName(Team2IdType, Team2Id, 0, false);
            }

            set
            {
            }
        }

        public string WinningTeamName
        {
            get
            {
                TeamSeason t = DataAccess.Playoffs.GetBracketWinner(PlayoffId, RoundNo, GameNo);
                if (t != null)
                    return t.Name;

                return String.Empty;
            }

            set { }

        }

        private string GetTeamName(string idType, long teamId, int modifier, bool isHomeTeam)
        {
            string teamName = String.Empty;
            throw new NotImplementedException("Use the PlayoffGame foriegn key:");


            if (idType == "SEED")
            {
                var seeds = DataAccess.Playoffs.GetPlayoffSeeds(PlayoffId);
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
                ModelObjects.TeamSeason t = DataAccess.Playoffs.GetBracketWinner(PlayoffId, RoundNo - 1, prevGameNo);
                if (t != null)
                    teamName = t.Name;
            }

            return teamName;
        }
    }
}
