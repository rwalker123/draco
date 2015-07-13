using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ModelObjects
{
    public class AspNetUser
    {
        public string Id { get; set; } // Id (Primary key)
        public string Email { get; set; } // Email
        public bool EmailConfirmed { get; set; } // EmailConfirmed
        public string PasswordHash { get; set; } // PasswordHash
        public string SecurityStamp { get; set; } // SecurityStamp
        public string PhoneNumber { get; set; } // PhoneNumber
        public bool PhoneNumberConfirmed { get; set; } // PhoneNumberConfirmed
        public bool TwoFactorEnabled { get; set; } // TwoFactorEnabled
        public DateTime? LockoutEndDateUtc { get; set; } // LockoutEndDateUtc
        public bool LockoutEnabled { get; set; } // LockoutEnabled
        public int AccessFailedCount { get; set; } // AccessFailedCount
        public string UserName { get; set; } // UserName

        // Reverse navigation
        public virtual ICollection<AspNetRole> AspNetRoles { get; set; } // Many to many mapping
        //public virtual ICollection<AspNetUserClaim> AspNetUserClaims { get; set; } // AspNetUserClaims.FK_dbo.AspNetUserClaims_dbo.AspNetUsers_User_Id
        //public virtual ICollection<AspNetUserLogin> AspNetUserLogins { get; set; } // Many to many mapping
        public virtual ICollection<Contact> Contacts { get; set; } // Contacts.FK_Contacts_AspNetUsers
        
        public AspNetUser()
        {
            //AspNetUserClaims = new List<AspNetUserClaim>();
            //AspNetUserLogins = new List<AspNetUserLogin>();
            Contacts = new List<Contact>();
            AspNetRoles = new List<AspNetRole>();
        }
}