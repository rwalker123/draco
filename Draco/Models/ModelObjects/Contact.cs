using SportsManager.Models.Helpers;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for Contact
    /// </summary>
    public class Contact
    {
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
        //public int? FirstYear { get; set; } // FirstYear
        public DateTime DateOfBirth { get; set; } // DateOfBirth
        public bool? IsFemale { get; set; } // IsFemale
        public string Email { get; set; } // Email

        // Foriegn Keys
        public virtual AspNetUser AspNetUser { get; set; } // FK_Contacts_AspNetUser

        // Reverse navigation
        public virtual ICollection<ContactRole> ContactRoles { get; set; } // ContactRoles.FK_ContactRoles_Contacts
        public virtual ICollection<FieldContact> FieldContacts { get; set; } // FieldContacts.FK_FieldContacts_Contacts
        public virtual ICollection<HOFMember> Hofs { get; set; } // hof.FK_hof_Contacts
        public virtual ICollection<Umpire> LeagueUmpires { get; set; } // LeagueUmpires.FK_LeagueUmpires_Contacts
        public virtual ICollection<MemberBusiness> MemberBusinesses { get; set; } // MemberBusiness.FK_MemberBusiness_Contacts
        public virtual ICollection<MessagePost> MessagePosts { get; set; } // MessagePost.FK_MessagePost_Contacts
        public virtual ICollection<MessageTopic> MessageTopics { get; set; } // MessageTopic.FK_MessageTopic_Contacts
        public virtual ICollection<ProfileQuestionAnswer> PlayerProfiles { get; set; } // PlayerProfile.FK_PlayerProfile_Contacts
        public virtual ICollection<PlayersWantedClassified> PlayersWantedClassifieds { get; set; } // PlayersWantedClassified.FK_PlayersWantedClassified_Contacts
        public virtual ICollection<Player> Rosters { get; set; } // Roster.FK_Roster_Contacts
        public virtual ICollection<TeamManager> TeamSeasonManagers { get; set; } // TeamSeasonManager.FK_TeamSeasonManager_Contacts
        public virtual ICollection<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers.FK_VoteAnswers_Contacts

        public Contact()
        {
            IsFemale = false;
            ContactRoles = new List<ContactRole>();
            FieldContacts = new List<FieldContact>();
            Hofs = new List<HOFMember>();
            LeagueUmpires = new List<Umpire>();
            MemberBusinesses = new List<MemberBusiness>();
            MessagePosts = new List<MessagePost>();
            MessageTopics = new List<MessageTopic>();
            PlayerProfiles = new List<ProfileQuestionAnswer>();
            PlayersWantedClassifieds = new List<PlayersWantedClassified>();
            Rosters = new List<Player>();
            TeamSeasonManagers = new List<TeamManager>();
            VoteAnswers = new List<VoteAnswer>();
        }

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


    }
}
