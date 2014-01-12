using System;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class EMailUsersViewModel : AccountViewModel
    {
        public EMailUsersViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            ModelObjects.Contact currentUser = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            Email = currentUser.Email;
            UserName = currentUser.FirstName + " " + currentUser.LastName;
            PhotoUrl = currentUser.PhotoURL;
        }

        public string Email { get; private set; }
        public string UserName { get; private set; }
        public string PhotoUrl { get; private set; }
    }
}