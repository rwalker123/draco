using System;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class ContactViewModel : IComparable
    {
        public long Id { get; set; } // Id (Primary key)
        public string UserId { get; set; } // UserId

        [Required]
        [StringLength(100, MinimumLength=1)]
        public string LastName { get; set; } // LastName

        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string FirstName { get; set; } // FirstName

        public string MiddleName { get; set; } // MiddleName
        public string Phone1 { get; set; } // Phone1
        public string Phone2 { get; set; } // Phone2
        public string Phone3 { get; set; } // Phone3
        public long CreatorAccountId { get; set; } // CreatorAccountId
        public string StreetAddress { get; set; } // StreetAddress
        public string City { get; set; } // City
        public string State { get; set; } // State
        public string Zip { get; set; } // Zip
        public int FirstYear { get; set; } // FirstYear
        public DateTime DateOfBirth { get; set; } // DateOfBirth
        public bool IsFemale { get; set; } // IsFemale
        public string Email { get; set; } // Email

        public string FullName
        {
            get
            {
                return Globals.BuildFullName(FirstName, MiddleName, LastName);
            }
        }

        public string FullNameFirst
        {
            get
            {
                return Globals.BuildFullNameFirst(FirstName, MiddleName, LastName);
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

        #region IComparable Members

        public int CompareTo(object obj)
        {
            var p = obj as ContactViewModel;
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