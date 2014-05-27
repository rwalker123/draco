using System;
using System.Collections.Generic;
using System.Text;
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
        }

        public bool DisplayPosterPhoto { get; private set; }
        public bool ShowMemberBusiness { get; private set; }
    }
}