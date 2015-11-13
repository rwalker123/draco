using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using SportsManager.Model;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class TeamViewModel 
    {
        public TeamViewModel(long accountId, long seasonId, ModelObjects.Team team)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            Name = team.Name;
            LeagueSeasonId = team.LeagueId;
            TeamSeasonId = team.Id;
        }

        public TeamViewModel(long accountId, long seasonId, long flightId)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            LeagueSeasonId = flightId;
        }

        public void FillTeamMembers()
        {
            IEnumerable<GolfRoster> players = DataAccess.Golf.GolfRosters.GetRoster(TeamSeasonId);

            TeamMembers = (from p in players
                           select new PlayerViewModel(p)).ToList();

            foreach (var tm in TeamMembers)
                tm.GetPlayerScoresForHandicap();
        }

        public void FillScheduleData()
        {
            IEnumerable<GolfMatch> upcomingMatches = DataAccess.Golf.GolfMatches.GetNotCompletedMatchesForTeam(TeamSeasonId);

            UpcomingMatches = (from um in upcomingMatches
                               select new GolfMatchViewModel(um));

            IEnumerable<GolfMatch> completedMatches = DataAccess.Golf.GolfMatches.GetCompletedMatchesForTeam(TeamSeasonId);

            CompletedMatches = (from cm in completedMatches
                                select new GolfMatchViewModel(cm));
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