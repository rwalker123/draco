using ModelObjects;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueTeamsViewModel : AccountViewModel
    {
        public LeagueTeamsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public IEnumerable<League> Leagues
        {
            get
            {
                return DataAccess.Leagues.GetLeagues(DataAccess.Seasons.GetCurrentSeason(AccountId));
            }
        }

        public IQueryable<Division> Divisions(long leagueId)
        {
            return DataAccess.Divisions.GetDivisions(leagueId);
        }

        public IQueryable<Team> GetDivisionTeams(long divisionId)
        {
            return DataAccess.Teams.GetDivisionTeams(divisionId);
        }
    }
}