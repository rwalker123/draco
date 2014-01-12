using System;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class UserRolesViewModel : AccountViewModel
    {
        public UserRolesViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            AccountAdminId = DataAccess.ContactRoles.GetAdminAccountId();
            AccountPhotoAdminId = DataAccess.ContactRoles.GetAccountPhotoAdminId();
            LeagueAdminId = DataAccess.ContactRoles.GetLeagueAdminId();
            TeamAdminId = DataAccess.ContactRoles.GetTeamAdminId();
            TeamPhotoAdminId = DataAccess.ContactRoles.GetTeamPhotoAdminId();
            IsAccountOwner = DataAccess.Accounts.IsAccountOwner(accountId);
        }

        public String CurrentUserId
        {
            get
            {
                return Globals.GetCurrentUserId();
            }
        }

        public bool IsAccountOwner
        {
            get;
            private set;
        }

        public String AccountAdminId
        {
            get;
            private set;
        }

        public String AccountPhotoAdminId
        {
            get;
            private set;
        }

        public String LeagueAdminId
        {
            get;
            private set;
        }

        public String TeamAdminId
        {
            get;
            private set;
        }

        public String TeamPhotoAdminId
        {
            get;
            private set;
        }
    }
}