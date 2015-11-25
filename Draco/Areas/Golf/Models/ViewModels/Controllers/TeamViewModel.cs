using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class TeamViewModel 
    {
        public TeamViewModel(long accountId, long seasonId, TeamSeason team)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            Name = team.Name;
            LeagueSeasonId = team.LeagueSeasonId;
            TeamSeasonId = team.Id;
        }

        public TeamViewModel(long accountId, long seasonId, long flightId)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            LeagueSeasonId = flightId;
        }

        public void FillTeamMembers(DB db)
        {
            var players = db.GolfRosters.Where(gr => gr.TeamSeasonId == TeamSeasonId && gr.IsActive);
            TeamMembers = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PlayerViewModel>>(players); 

            foreach (var tm in TeamMembers)
                tm.GetPlayerScoresForHandicap();
        }

        public void FillScheduleData(IDb db)
        {
            var upcomingMatches = db.GetNotCompletedMatchesForTeam(TeamSeasonId);

            UpcomingMatches = Mapper.Map<IQueryable<GolfMatch>, IEnumerable<GolfMatchViewModel>>(upcomingMatches);

            var completedMatches = db.GetCompletedMatchesForTeam(TeamSeasonId);

            CompletedMatches = Mapper.Map<IQueryable<GolfMatch>, IEnumerable<GolfMatchViewModel>>(completedMatches);
        }

        [ScaffoldColumn(false)]
        public IEnumerable<PlayerViewModel> TeamMembers { get; private set; }

        [ScaffoldColumn(false)]
        public IEnumerable<GolfMatchViewModel> UpcomingMatches { get; private set; }

        [ScaffoldColumn(false)]
        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }

        [ScaffoldColumn(false)]
        public long AccountId { get; private set; }

        [ScaffoldColumn(false)]
        public long SeasonId { get; private set; }

        [ScaffoldColumn(false)]
        public long LeagueSeasonId { get; private set; }

        [ScaffoldColumn(false)]
        public long TeamSeasonId { get; private set; }

        [Required, StringLength(25)]
        public string Name { get; set; }
    }
}