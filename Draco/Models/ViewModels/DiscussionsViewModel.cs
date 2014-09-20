using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class DiscussionsViewModel : AccountViewModel
    {
        public DiscussionsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            var displayPosterPhoto = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "MsgBoardShowPhoto"), out displayPosterPhoto);
            DisplayPosterPhoto = displayPosterPhoto;

            var showMemberBusiness = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowBusinessDirectory"), out showMemberBusiness);
            ShowMemberBusiness = showMemberBusiness;

            var showPlayerClassified = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowPlayerClassified"), out showPlayerClassified);
            ShowPlayerClassified = showPlayerClassified;

            var showFacebookLike = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowFacebookLike"), out showFacebookLike);
            ShowFacebookLike = showFacebookLike;

            if (showPlayerClassified)
            {
                // number of players requesting teams.
                NumberOfPlayerRequests = DataAccess.PlayerClassifieds.GetTeamsWanted(accountId, string.Empty).Count();
                // number of teams requesting players.
                NumberOfTeamRequests = DataAccess.PlayerClassifieds.GetPlayersWanted(accountId).Count();
            }
        }

        public bool DisplayPosterPhoto { get; private set; }
        public bool ShowMemberBusiness { get; private set; }
        public bool ShowPlayerClassified { get; private set; }
        public bool ShowFacebookLike { get; private set; }

        public int NumberOfPlayerRequests { get; private set; }
        public int NumberOfTeamRequests { get; private set; }
    }
}