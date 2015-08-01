using System;

namespace SportsManager.ViewModels.API
{
    public class PlayerViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; } //= r.AccountId,
        public long TeamId { get; set; } //= rs.TeamSeasonId,
        public int PlayerNumber { get; set; }
        public bool SubmittedWaiver { get; set; }
        public ContactViewModel Contact { get; set; } // = new Contact(r.Contact.Id, r.Contact.Email, r.Contact.LastName, r.Contact.FirstName, r.Contact.MiddleName, r.Contact.Phone1, r.Contact.Phone2, r.Contact.Phone3, r.Contact.CreatorAccountId, r.Contact.StreetAddress, r.Contact.City, r.Contact.State, r.Contact.Zip, r.Contact.FirstYear.GetValueOrDefault(), r.Contact.DateOfBirth, r.Contact.UserId),
        public bool SubmittedDriversLicense { get; set; } // = r.SubmittedDriversLicense,
        public DateTime DateAdded { get; set; }
        public string AffiliationDuesPaid { get; set; }  //= GetAffiliationsDues(rs.PlayerId, seasonId),
        public int GamesPlayed { get; set; }  //= 0
    }
}