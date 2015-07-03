using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class ContactViewModel
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
    }
}