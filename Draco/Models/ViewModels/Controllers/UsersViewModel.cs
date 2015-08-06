using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class UsersViewModel : AccountViewModel
    {
        public UsersViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }

        public int PageSize
        {
            get { return SportsManager.Controllers.ContactsODataController.PageSize; }
        }

        public int AccountFirstYear
        {
            get { return Account.FirstYear;  }
        }
    }
}