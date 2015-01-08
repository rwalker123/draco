using System;

namespace ModelObjects
{
    public class ContactName
    {
        public ContactName()
        {
        }

        public ContactName(long id, string firstName, string lastName, string middleName, string photoUrl, DateTime birthDate)
        {
            Id = id;
            FirstName = firstName;
            LastName = lastName;
            MiddleName = middleName;
            PhotoURL = photoUrl;
            BirthDate = birthDate;
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

    public class ContactNameRole : ContactName
    {
        public long RoleData { get; set; }
        public string RoleDataText { get; set; }
        public string RoleId { get; set; }
    }
}