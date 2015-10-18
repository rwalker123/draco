using SportsManager.Models.Helpers;
using System;

namespace SportsManager.ViewModels.API
{
    public class ContactNameViewModel
    {
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
                return PhotoURLHelper.GetPhotoURL(Id);
            }
            set { } 
        }
        public int FirstYear { get; set; }
        public string Zip { get; set; }
        public DateTime BirthDate { get; set; }
    }

    public class ContactNameRoleViewModel : ContactNameViewModel
    {
        public long AccountId { get; set; }
        public long ContactId { get; set; }
        public long RoleData { get; set; }
        // TODO: not sure how to get this with mappers
        // maybe the client should get the info based on RoleData.
        //public string RoleDataText { get; set; }
        public string RoleId { get; set; }
    }
}