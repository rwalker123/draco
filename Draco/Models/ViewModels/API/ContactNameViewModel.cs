using SportsManager.Models.Helpers;
using System;

namespace SportsManager.ViewModels.API
{
    public class ContactNameViewModel
    {
        string photoUrl = String.Empty;

        public ContactNameViewModel()
        {
        }

        public long Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }

        public string PhotoURL
        {
            get
            {
                if (photoUrl == "")
                    photoUrl = PhotoURLHelper.GetPhotoURL(Id);
                return photoUrl;
            }
            set
            {
                photoUrl = value;
            }
        }
        public string Zip { get; set; }
        public DateTime BirthDate { get; set; }
        
        // so it can be searched.
        public int FirstYear { get; set; }
    }

    public class ContactNameRoleViewModel : ContactNameViewModel
    {
        public long AccountId { get; set; }
        public long ContactId { get; set; }
        public long RoleData { get; set; }
        public string RoleDataText { get; set; }
        public string RoleId { get; set; }
    }
}