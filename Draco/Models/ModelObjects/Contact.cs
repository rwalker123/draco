using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for Contact
    /// </summary>
    public class Contact : IComparable
    {
        private static string PhotoName = "ContactPhoto.jpg";
        private static string LargePhotoName = "ContactActionPhoto.jpg";

        public long Id { get; set; } // Id (Primary key)
        public string UserId { get; set; } // UserId
        public string LastName { get; set; } // LastName
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
        public int? FirstYear { get; set; } // FirstYear
        public DateTime DateOfBirth { get; set; } // DateOfBirth
        public bool? IsFemale { get; set; } // IsFemale
        public string Email { get; set; } // Email

        // Reverse navigation
        public virtual ICollection<ContactRole> ContactRoles { get; set; } // ContactRoles.FK_ContactRoles_Contacts
        public virtual ICollection<FieldContact> FieldContacts { get; set; } // FieldContacts.FK_FieldContacts_Contacts
        public virtual ICollection<Hof> Hofs { get; set; } // hof.FK_hof_Contacts
        public virtual ICollection<LeagueUmpire> LeagueUmpires { get; set; } // LeagueUmpires.FK_LeagueUmpires_Contacts
        public virtual ICollection<MemberBusiness> MemberBusinesses { get; set; } // MemberBusiness.FK_MemberBusiness_Contacts
        public virtual ICollection<MessagePost> MessagePosts { get; set; } // MessagePost.FK_MessagePost_Contacts
        public virtual ICollection<MessageTopic> MessageTopics { get; set; } // MessageTopic.FK_MessageTopic_Contacts
        public virtual ICollection<PlayerProfile> PlayerProfiles { get; set; } // PlayerProfile.FK_PlayerProfile_Contacts
        public virtual ICollection<PlayersWantedClassified> PlayersWantedClassifieds { get; set; } // PlayersWantedClassified.FK_PlayersWantedClassified_Contacts
        public virtual ICollection<Roster> Rosters { get; set; } // Roster.FK_Roster_Contacts
        public virtual ICollection<TeamSeasonManager> TeamSeasonManagers { get; set; } // TeamSeasonManager.FK_TeamSeasonManager_Contacts
        public virtual ICollection<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers.FK_VoteAnswers_Contacts

        public Contact()
        {
            IsFemale = false;
            ContactRoles = new List<ContactRole>();
            FieldContacts = new List<FieldContact>();
            Hofs = new List<Hof>();
            LeagueUmpires = new List<LeagueUmpire>();
            MemberBusinesses = new List<MemberBusiness>();
            MessagePosts = new List<MessagePost>();
            MessageTopics = new List<MessageTopic>();
            PlayerProfiles = new List<PlayerProfile>();
            PlayersWantedClassifieds = new List<PlayersWantedClassified>();
            Rosters = new List<Roster>();
            TeamSeasonManagers = new List<TeamSeasonManager>();
            VoteAnswers = new List<VoteAnswer>();
        }

        static public string BuildFullName(string firstName, string middleName, string lastName)
        {
            string fullName = lastName + ", " + firstName + " " + middleName;
            return fullName.Trim();
        }

        static public string BuildFullNameFirst(string firstName, string middleName, string lastName)
        {
            System.Text.StringBuilder fullName = new System.Text.StringBuilder(firstName + " ");

            if (!String.IsNullOrWhiteSpace(middleName))
                fullName.Append(middleName + " ");

            fullName.Append(lastName);

            return fullName.ToString();
        }

        public string FullNameFirst
        {
            get
            {
                return Contact.BuildFullNameFirst(FirstName, MiddleName, LastName);
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

        static public string GetLargePhotoURL(long id)
        {
            Contact c = new Contact();
            c.Id = id;
            return c.LargePhotoURL;
        }

        public string PhotoURL
        {
            get
            {
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Contacts/" + Id + "/" + PhotoName);
            }
        }

        public string LargePhotoURL
        {
            get
            {
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Contacts/" + Id + "/" + LargePhotoName);
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
