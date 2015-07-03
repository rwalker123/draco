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
        public string PhotoURL { get; set; }
        public int FirstYear { get; set; }
        public string Zip { get; set; }
        public DateTime BirthDate { get; set; }
    }

    public class ContactNameRoleViewModel : ContactNameViewModel
    {
        public long RoleData { get; set; }
        public string RoleDataText { get; set; }
        public string RoleId { get; set; }
    }
}