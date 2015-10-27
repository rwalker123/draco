namespace ModelObjects
{
    /// <summary>
    /// Summary description for GameBatStats
    /// </summary>
    public class GameBatStats
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int Ab { get; set; } // AB
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int C2B { get; set; } // 2B
        public int C3B { get; set; } // 3B
        public int Hr { get; set; } // HR
        public int Rbi { get; set; } // RBI
        public int So { get; set; } // SO
        public int Bb { get; set; } // BB
        public int Re { get; set; } // RE
        public int Hbp { get; set; } // HBP
        public int Intr { get; set; } // INTR
        public int Sf { get; set; } // SF
        public int Sh { get; set; } // SH
        public int Sb { get; set; } // SB
        public int Cs { get; set; } // CS
        public int Lob { get; set; } // LOB

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_batstatsum_LeagueSchedule
        public virtual PlayerSeason RosterSeason { get; set; } // FK_batstatsum_RosterSeason
        public virtual TeamSeason TeamsSeason { get; set; } // FK_batstatsum_TeamsSeason

	}
}
