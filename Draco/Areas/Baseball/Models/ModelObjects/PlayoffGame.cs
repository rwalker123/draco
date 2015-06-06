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

        public string FieldName
        {
            get
            {
                return DataAccess.Fields.GetFieldName(FieldId);
            }
            set
            {

            }
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
                            return game.HScore;
                        else
                            return game.VScore;
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
                            return game.VScore;
                        else
                            return game.HScore;
                    }
                }

                return 0;
            }

            set { }
        }
    }
}