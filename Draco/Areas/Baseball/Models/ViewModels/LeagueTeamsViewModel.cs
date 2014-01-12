using ModelObjects;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueTeamsViewModel
    {
        public LeagueTeamsViewModel(long accountId)
        {
            AccountId = accountId;
        }

        public long AccountId { get; set; }

        public string GetAccountName()
        {
            return DataAccess.Accounts.GetAccountName(AccountId);
        }

        public IEnumerable<League> Leagues
        {
            get
            {
                return DataAccess.Leagues.GetLeagues(DataAccess.Seasons.GetCurrentSeason(AccountId));
            }
        }

        public int LoadDivisions(long leagueId)
        {
            Divisions = DataAccess.Divisions.GetDivisions(leagueId);

            return Divisions.Count();
        }

        public IQueryable<Division> Divisions
        {
            get;
            private set;
        }

        public IQueryable<Team> GetDivisionTeams(long divisionId)
        {
            return DataAccess.Teams.GetDivisionTeams(divisionId);
        }
    }
}