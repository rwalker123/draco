using System;
using System.Collections.Generic;

namespace SportsManager.ViewModels.API
{
    public class GameViewModel
    {
        public long Id { get; set; }
        public long FieldId { get; set; }
        public String Comment { get; set; }
        public DateTime GameDate { get; set; }
        public long HomeTeamId { get; set; } //HTeamId = g.HomeTeamId,
        public long AwayTeamId { get; set; } //VTeamId = g.AwayTeamId,
        public int HomeScore { get; set; } //HScore = g.HomeScore,
        public int AwayScore { get; set; } //VScore = g.AwayScore,
        public long LeagueId { get; set; } 
        public string LeagueName { get; set; }
        public int GameStatus { get; set; }
        public long Umpire1 { get; set; }
        public long Umpire2 { get; set; }
        public long Umpire3 { get; set; }
        public long Umpire4 { get; set; } 
        public long GameType { get; set; }
        public String HomeTeamName { get; set; }
        public String AwayTeamName { get; set; }
        public String FieldName { get; set; }
        public IEnumerable<long> HomePlayersPresent { get; set; }
        public IEnumerable<long> AwayPlayersPresent { get; set; }
        public bool HasGameRecap { get; set; }
    }
}