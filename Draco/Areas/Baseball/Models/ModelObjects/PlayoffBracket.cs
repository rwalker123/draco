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

    }
}
