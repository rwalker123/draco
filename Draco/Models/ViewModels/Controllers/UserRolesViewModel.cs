using SportsManager.Controllers;
using System;

namespace SportsManager.ViewModels
{
    public class UserRolesViewModel : AccountViewModel
    {
        public UserRolesViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            AccountAdminId = c.GetAdminAccountId();
            AccountPhotoAdminId = c.GetAccountPhotoAdminId();
            LeagueAdminId = c.GetLeagueAdminId();
            TeamAdminId = c.GetTeamAdminId();
            TeamPhotoAdminId = c.GetTeamPhotoAdminId();
            IsAccountOwner = c.IsAccountOwner(accountId);
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