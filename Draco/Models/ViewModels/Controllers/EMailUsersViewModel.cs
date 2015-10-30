using SportsManager.Controllers;
using SportsManager.Models.Helpers;

namespace SportsManager.ViewModels
{
    public class EMailUsersViewModel : AccountViewModel
    {
        public EMailUsersViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            var currentUser = c.GetCurrentContact(accountId);
            Email = currentUser.Email;
            UserName = currentUser.FirstName + " " + currentUser.LastName;
            PhotoUrl = PhotoURLHelper.GetPhotoURL(currentUser.Id);
        }

        public string Email { get; private set; }
        public string UserName { get; private set; }
        public string PhotoUrl { get; private set; }
    }
}