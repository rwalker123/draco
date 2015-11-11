using SportsManager.Models;
using System.Collections.Generic;

namespace ModelObjects
{
    public class LeagueSeason
    {
        public long Id { get; set; } // id (Primary key)
        public long LeagueId { get; set; } // LeagueId
        public long SeasonId { get; set; } // SeasonId

        // Reverse navigation
        public virtual ICollection<DivisionSeason> DivisionSeasons { get; set; } // DivisionSeason.FK_DivisionSeason_LeagueSeason
        public virtual ICollection<GameEjection> GameEjections { get; set; } // GameEjections.FK_GameEjections_LeagueSeason
        public virtual ICollection<GolfMatch> GolfMatches { get; set; } // GolfMatch.FK_GolfMatch_LeagueSeason
        public virtual ICollection<LeagueEvent> LeagueEvents { get; set; } // LeagueEvents.FK_LeagueEvents_LeagueSeason
        public virtual ICollection<Game> LeagueSchedules { get; set; } // LeagueSchedule.FK_LeagueSchedule_LeagueSeason
        public virtual ICollection<PlayoffSetup> PlayoffSetups { get; set; } // PlayoffSetup.FK_PlayoffSetup_LeagueSeason
        public virtual ICollection<TeamSeason> TeamsSeasons { get; set; } // TeamsSeason.FK_TeamsSeason_LeagueSeason

        // Foreign keys
        public virtual LeagueDefinition League { get; set; } // FK_LeagueSeason_League
        public virtual Season Season { get; set; } // FK_LeagueSeason_Season

        public LeagueSeason()
        {
            DivisionSeasons = new List<DivisionSeason>();
            GameEjections = new List<GameEjection>();
            GolfMatches = new List<GolfMatch>();
            LeagueEvents = new List<LeagueEvent>();
            LeagueSchedules = new List<Game>();
            PlayoffSetups = new List<PlayoffSetup>();
            TeamsSeasons = new List<TeamSeason>();
        }
    }
}
