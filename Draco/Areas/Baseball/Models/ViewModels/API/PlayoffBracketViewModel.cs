using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.API
{
    public class PlayoffBracketViewModel
    {
        public long Id { get; set; } 
        public long PlayoffId { get; set; }
        public long Team1Id { get; set; }
        public string Team1IdType { get; set; }
        public long Team2Id { get; set; }
        public string Team2IdType { get; set; }
        public int GameNo { get; set; }
        public int RoundNo { get; set; }
        public int NumGamesInSeries { get; set; }

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