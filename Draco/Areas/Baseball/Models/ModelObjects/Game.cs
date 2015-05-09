using System;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Game
	/// </summary>
	public class Game
	{
		//public enum GameStatus
		//{
		//    Incomplete = 0,
		//    Final = 1,
		//    Rainout = 2,
		//    Postponed = 3,
		//    Forfiet = 4,
		//    DidNotReport = 5
		//}

		//public enum GameType
		//{
		//    Regular = 0,
		//    Tournament = 1
		//}

		public Game()
		{
            AwayPlayersPresent = new List<long>();
            HomePlayersPresent = new List<long>();
		}

		public Game(long leagueId, long gameId, DateTime gameDate, 
			long hTeamId, long vTeamId, int hScore, int vScore, string comment,
			long fieldId, int gameStatus, long gameType,
			long umpire1, long umpire2, long umpire3, long umpire4)
		{
            AwayPlayersPresent = new List<long>();
            HomePlayersPresent = new List<long>();
            
            Id = gameId;
			LeagueId = leagueId;
			GameDate = gameDate; // .ToString("d");
			HomeTeamId = hTeamId;
			AwayTeamId = vTeamId;
			AwayScore = vScore;
			HomeScore = hScore;
			FieldId = fieldId;
			GameStatus = gameStatus;
			Comment = comment;
			GameType = gameType;

			Umpire1 = umpire1;
			Umpire2 = umpire2;
			Umpire3 = umpire3;
			Umpire4 = umpire4;
		}

		public long Id { get; set; }
		public long LeagueId { get; set; }
		public DateTime GameDate { get; set; }
		public long HomeTeamId { get; set; }
		public long AwayTeamId { get; set; }
		public int HomeScore { get; set; }
		public int AwayScore { get; set; }
		public string Comment { get; set; }
		public long FieldId { get; set; }
		public long GameType { get; set; }
		public int GameStatus { get; set; }
		public long Umpire1 { get; set; }
		public long Umpire2 { get; set; }
		public long Umpire3 { get; set; }
		public long Umpire4 { get; set; }
        public bool HasGameRecap { get; set; }

        public string HomeTeamName { get; set; }
        public string AwayTeamName { get; set; }
        public string FieldName { get; set; }
        public string LeagueName { get; set; }
        public IEnumerable<long> HomePlayersPresent { get; set; }
        public IEnumerable<long> AwayPlayersPresent { get; set; }

		public string GameStatusText
		{
			get
			{
				switch (GameStatus)
				{
					case 0:
						return "I";
					case 1:
						return "F";
					case 2:
						return "R";
					case 3:
						return "PPD";
					case 4:
						return "FG";
					case 5:
						return "DNR";
					default:
						return string.Empty;
				}
			}

            set
            {

            }
		}

		public string GameStatusLongText
		{
			get
			{
				switch (GameStatus)
				{
					case 0:
						return "Incomplete";
					case 1:
						return "Final";
					case 2:
						return "Rainout";
					case 3:
						return "Postponed";
					case 4:
						return "Forfeit";
					case 5:
						return "Did not report";
					default:
						return string.Empty;
				}
			}
            set
            {

            }
        }

		public long GameWinner
		{
			get
			{
				long ret = -1;

				if (IsGameComplete)
				{
					if (HomeScore > AwayScore)
						ret = HomeTeamId;
					else if (HomeScore < AwayScore)
						ret = AwayTeamId;
					else if (HomeScore == AwayScore)
						ret = 0;
				}

				return ret;
			}
            set
            {

            }
        }

		public bool IsGameComplete
		{
            get
            {
                return (GameStatus == 1 || GameStatus == 4);
            }
            set
            {

            }
        }
	}
}
