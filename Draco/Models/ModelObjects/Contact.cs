using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for Contact
    /// </summary>
    public class Contact : IComparable
    {
        public long Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string Phone1 { get; set; }
        public string Phone2 { get; set; }
        public string Phone3 { get; set; }
        public long CreatorAccountId { get; set; }
        public string StreetAddress { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public int FirstYear { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool IsFemale { get; set; }
        public string UserId { get; set; }

        private static string PhotoName = "ContactPhoto.jpg";
        private static string LargePhotoName = "ContactActionPhoto.jpg";
        private static string ContactsUploadDir = Globals.UploadDirRoot + "Contacts/";

        public Contact()
        {
        }

        public void Copy(SportsManager.Model.Contact copyTo)
        {
            copyTo.Email = Email;
            copyTo.FirstName = FirstName;
            copyTo.LastName = LastName;
            copyTo.MiddleName = MiddleName;
            copyTo.Phone1 = Phone1;
            copyTo.Phone2 = Phone2;
            copyTo.Phone3 = Phone3;
            copyTo.CreatorAccountId = CreatorAccountId;
            copyTo.StreetAddress = StreetAddress;
            copyTo.City = City;
            copyTo.State = State;
            copyTo.Zip = Zip;
            copyTo.FirstYear = FirstYear;
            copyTo.DateOfBirth = DateOfBirth;
            copyTo.UserId = UserId;
        }
        
        public Contact(long id, string email, string lastName, string firstName, string middleName,
                    string phone1, string phone2, string phone3, long creatorAccountId, 
                    string streetAddress, string city, string state, string zip, int fy, 
                    DateTime? dob, string userId)
        {
            Id = id;
            Email = email;
            FirstName = firstName;
            LastName = lastName;
            MiddleName = middleName;
            Phone1 = phone1;
            Phone2 = phone2;
            Phone3 = phone3;
            CreatorAccountId = creatorAccountId;
            StreetAddress = streetAddress;
            City = city;
            State = state;
            Zip = zip;
            FirstYear = fy;

            DateOfBirth = dob;
            UserId = userId;
        }

        public string UserName
        {
            get { return Email; }
        }

        public string FullName
        {
            get
            {
                string fullName = LastName + ", " + FirstName + " " + MiddleName;
                return fullName.Trim();
            }
        }

        public string FullNameFirst
        {
            get
            {
                System.Text.StringBuilder fullName = new System.Text.StringBuilder(FirstName + " ");

                if (!String.IsNullOrWhiteSpace(MiddleName))
                    fullName.Append(MiddleName + " ");

                fullName.Append(LastName);

                return fullName.ToString();
            }
        }

        public string SinglePhone
        {
            get
            {
                if (!String.IsNullOrEmpty(Phone1))
                    return Phone1;

                if (!String.IsNullOrEmpty(Phone2))
                    return Phone2;

                return Phone3 ?? String.Empty;
            }
        }

        public string CityState
        {
            get
            {
                if (String.IsNullOrWhiteSpace(City))
                    return State;

                if (String.IsNullOrWhiteSpace(State))
                    return City;

                return City + ", " + State;
            }
        }

        static public string GetPhotoURL(long id)
        {
            Contact c = new Contact();
            c.Id = id;
            return c.PhotoURL;
        }

        public string PhotoURL
        {
            get
            {
                if (PhotoFile != null)
                    return ContactsUploadDir + Id + PhotoName;
                else
                    return null;
            }
        }

        public string PhotoURLName
        {
            get
            {
                return ContactsUploadDir + Id + PhotoName;
            }
        }

        public string PhotoFile
        {
            get
            {
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(ContactsUploadDir + Id + PhotoName);
                System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
                if (fileInfo.Exists)
                    return fileInfo.FullName;
                else
                    return null;
            }
        }

        public string LargePhotoURL
        {
            get
            {
                if (LargePhotoFile != null)
                    return ContactsUploadDir + Id + LargePhotoName;
                else
                    return null;
            }
        }

        public string LargePhotoURLName
        {
            get
            {
                return ContactsUploadDir + Id + LargePhotoName;
            }
        }

        public string LargePhotoFile
        {
            get
            {
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(ContactsUploadDir + Id + LargePhotoName);
                System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
                if (fileInfo.Exists)
                    return fileInfo.FullName;
                else
                    return null;
            }
        }

        #region IComparable Members

        public int CompareTo(object obj)
        {
            Contact p = obj as Contact;
            if (p == null)
                return 0;

            int rc = String.Compare(LastName, p.LastName, true);
            if (rc == 0)
            {
                rc = String.Compare(FirstName, p.FirstName, true);

                if (rc == 0)
                    rc = String.Compare(MiddleName, p.MiddleName, true);
            }

            return rc;
        }

        #endregion
    }
}
