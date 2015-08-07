using System;
using System.Collections.Generic;
using System.Reflection;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for GamePitchStats
    /// </summary>
    public class GamePitchStats
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int Ip { get; set; } // IP
        public int Ip2 { get; set; } // IP2
        public int Bf { get; set; } // BF
        public int W { get; set; } // W
        public int L { get; set; } // L
        public int S { get; set; } // S
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int Er { get; set; } // ER
        public int C2B { get; set; } // 2B
        public int C3B { get; set; } // 3B
        public int Hr { get; set; } // HR
        public int So { get; set; } // SO
        public int Bb { get; set; } // BB
        public int Wp { get; set; } // WP
        public int Hbp { get; set; } // HBP
        public int Bk { get; set; } // BK
        public int Sc { get; set; } // SC
        public int? Tb { get; set; } // TB
        public int? Ab { get; set; } // AB
        public int? WhipNumerator { get; set; } // WHIPNumerator
        public int? IpNumerator { get; set; } // IPNumerator

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_pitchstatsum_LeagueSchedule
        public virtual PlayerSeason RosterSeason { get; set; } // FK_pitchstatsum_RosterSeason
        public virtual TeamSeason TeamsSeason { get; set; } // FK_pitchstatsum_TeamsSeason

    }
}
