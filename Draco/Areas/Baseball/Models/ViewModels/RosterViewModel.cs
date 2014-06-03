using SportsManager.ViewModels;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class RosterViewModel : AccountViewModel
    {
        public RosterViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);

            var showWaiverStatus = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowWaiver"), out showWaiverStatus);
            ShowWaiverStatus = showWaiverStatus;

            var showIdStatus = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowIdentification"), out showIdStatus);
            ShowIdStatus = showIdStatus;

            var trackPlayerWaiver = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "TrackWaiver"), out trackPlayerWaiver);
            TrackPlayerWaiver = trackPlayerWaiver;

            var trackIdSubmitted = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "TrackIdentification"), out trackIdSubmitted);
            TrackIdSubmitted = trackIdSubmitted;

            TeamId = teamSeasonId;
        }

        public bool IsTeamAdmin { get; private set; }

        public bool ShowWaiverStatus { get; private set; }
        public bool ShowIdStatus { get; private set; }
        public bool TrackPlayerWaiver { get; private set; }
        public bool TrackIdSubmitted { get; private set; }
        public long TeamId { get; private set; }
    }
}
