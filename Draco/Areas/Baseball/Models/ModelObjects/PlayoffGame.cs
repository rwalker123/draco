using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffGame
/// </summary>
	public class PlayoffGame
	{
        public long Id { get; set; } // id (Primary key)
        public long BracketId { get; set; } // BracketId
        public long FieldId { get; set; } // FieldId
        public DateTime GameDate { get; set; } // gameDate
        public DateTime GameTime { get; set; } // gameTime
        public long GameId { get; set; } // GameId
        public long PlayoffId { get; set; } // PlayoffId
        public int SeriesGameNo { get; set; } // SeriesGameNo
        public bool Team1HomeTeam { get; set; } // Team1HomeTeam

        // Foreign keys
        public virtual PlayoffBracket PlayoffBracket { get; set; } // FK_PlayoffGame_PlayoffGame
    }
}