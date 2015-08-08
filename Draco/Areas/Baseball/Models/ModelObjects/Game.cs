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

        public long Id { get; set; } // id (Primary key)
        public DateTime GameDate { get; set; } // GameDate
        public long HTeamId { get; set; } // HTeamId
        public long VTeamId { get; set; } // VTeamId
        public int HScore { get; set; } // HScore
        public int VScore { get; set; } // VScore
        public string Comment { get; set; } // Comment
        public long FieldId { get; set; } // FieldId
        public long LeagueId { get; set; } // LeagueId
        public int GameStatus { get; set; } // GameStatus
        public long GameType { get; set; } // GameType
        public long Umpire1 { get; set; } // Umpire1
        public long Umpire2 { get; set; } // Umpire2
        public long Umpire3 { get; set; } // Umpire3
        public long Umpire4 { get; set; } // Umpire4

        // Reverse navigation
        public virtual ICollection<GameBatStats> Batstatsums { get; set; } // batstatsum.FK_batstatsum_LeagueSchedule
        //public virtual ICollection<Fieldstatsum> Fieldstatsums { get; set; } // fieldstatsum.FK_fieldstatsum_LeagueSchedule
        public virtual ICollection<GameEjection> GameEjections { get; set; } // GameEjections.FK_GameEjections_LeagueSchedule
        public virtual ICollection<GameRecap> GameRecaps { get; set; } // Many to many mapping
        public virtual ICollection<GamePitchStats> Pitchstatsums { get; set; } // pitchstatsum.FK_pitchstatsum_LeagueSchedule
        public virtual ICollection<PlayerRecap> PlayerRecaps { get; set; } // Many to many mapping
        public virtual Field AvailableField { get; set; }

        // Foreign keys
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_LeagueSchedule_LeagueSeason
        
        public Game()
        {
            Batstatsums = new List<GameBatStats>();
            //Fieldstatsums = new List<Fieldstatsum>();
            GameEjections = new List<GameEjection>();
            GameRecaps = new List<GameRecap>();
            Pitchstatsums = new List<GamePitchStats>();
            PlayerRecaps = new List<PlayerRecap>();
        }

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
        }

		public long GameWinner
		{
			get
			{
				long ret = -1;

				if (IsGameComplete)
				{
					if (HScore > VScore)
						ret = HTeamId;
					else if (HScore < VScore)
						ret = VTeamId;
					else if (HScore == VScore)
						ret = 0;
				}

				return ret;
			}
        }

		public bool IsGameComplete
		{
            get
            {
                return (GameStatus == 1 || GameStatus == 4);
            }
        }
	}
}
