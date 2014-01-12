
using System.Collections.Generic;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
    public class ScheduleViewModel
    {
        public ScheduleViewModel(long accountId, long seasonId)
        {
            AccountId = accountId;
            SeasonId = seasonId;

            AccountName = DataAccess.Accounts.GetAccountName(AccountId);
            Leagues = DataAccess.Leagues.GetLeagues(seasonId);
        }

        public long AccountId { get; private set; }
        public long SeasonId { get; private set; }
        public string AccountName { get; private set; }

        public IEnumerable<League> Leagues
        {
            get;
            private set;
        }
    }
}