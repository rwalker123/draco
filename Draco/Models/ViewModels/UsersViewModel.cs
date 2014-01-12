using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class UsersViewModel : AccountViewModel
    {
        public UsersViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public int PageSize
        {
            get { return SportsManager.Controllers.ContactsODataController.PageSize; }
        }
    }
}