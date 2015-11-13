using SportsManager.Controllers;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class RosterViewModel : AccountViewModel
    {
        public RosterViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsTeamAdmin = c.IsTeamAdmin(accountId, teamSeasonId);

            var showWaiverStatus = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowWaiver"), out showWaiverStatus);
            ShowWaiverStatus = showWaiverStatus;

            var showIdStatus = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowIdentification"), out showIdStatus);
            ShowIdStatus = showIdStatus;

            var trackGamesPlayed = false;
            bool.TryParse(c.GetAccountSetting(accountId, "TrackGamesPlayed"), out trackGamesPlayed);
            TrackGamesPlayed = trackGamesPlayed;

            var trackPlayerWaiver = false;
            bool.TryParse(c.GetAccountSetting(accountId, "TrackWaiver"), out trackPlayerWaiver);
            TrackPlayerWaiver = trackPlayerWaiver;

            var trackIdSubmitted = false;
            bool.TryParse(c.GetAccountSetting(accountId, "TrackIdentification"), out trackIdSubmitted);
            TrackIdSubmitted = trackIdSubmitted;

            var showUserInfoOnRosterPage = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowUserInfoOnRosterPage"), out showUserInfoOnRosterPage);
            ShowUserInfoOnRosterPage = showUserInfoOnRosterPage;

            TeamId = teamSeasonId;
        }

        public bool IsTeamAdmin { get; private set; }

        public bool ShowWaiverStatus { get; private set; }
        public bool ShowIdStatus { get; private set; }
        public bool TrackGamesPlayed { get; private set; }
        public bool TrackPlayerWaiver { get; private set; }
        public bool TrackIdSubmitted { get; private set; }
        public bool ShowUserInfoOnRosterPage { get; private set; }
        public long TeamId { get; private set; }
    }
}
