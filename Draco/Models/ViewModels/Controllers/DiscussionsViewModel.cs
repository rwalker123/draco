using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class DiscussionsViewModel : AccountViewModel
    {
        public DiscussionsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            var displayPosterPhoto = false;
            bool.TryParse(c.GetAccountSetting(accountId, "MsgBoardShowPhoto"), out displayPosterPhoto);
            DisplayPosterPhoto = displayPosterPhoto;

            var showMemberBusiness = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowBusinessDirectory"), out showMemberBusiness);
            ShowMemberBusiness = showMemberBusiness;

            var showPlayerClassified = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowPlayerClassified"), out showPlayerClassified);
            ShowPlayerClassified = showPlayerClassified;

            var showFacebookLike = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowFacebookLike"), out showFacebookLike);
            ShowFacebookLike = showFacebookLike;

            if (showPlayerClassified)
            {
                // number of players requesting teams.
                NumberOfPlayerRequests = c.Db.TeamsWantedClassifieds.Where(twc => twc.AccountId == accountId).Count();
                // number of teams requesting players.
                NumberOfTeamRequests = c.Db.PlayersWantedClassifieds.Where(pwc => pwc.AccountId == accountId).Count();
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