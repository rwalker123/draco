using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Utils;
using SportsManager.ViewModels.API;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerViewModel : SportsManager.ViewModels.AccountViewModel
    {
        public class AccountWithContactId
        {
            public Account Account { get; set; }
            public long ContactId { get; set; }
        }

        public enum IdType { ContactId, RosterSeasonId, RosterId };

        public PlayerViewModel(DBController c, long accountId, long id, IdType idType)
            : base(c, accountId)
        {
            bool isIdSeasonId = false;

            if (idType == IdType.RosterSeasonId)
            {
                var player = c.Db.RosterSeasons.Find(id);
                if (player != null)
                    Contact = player.Roster.Contact;

                isIdSeasonId = true;
            }
            else if (idType == IdType.ContactId)
            {
                Contact = c.Db.Contacts.Find(id);
            }
            else if (idType == IdType.RosterId)
            {
                var player = c.Db.Rosters.Find(id);
                if (player != null)
                {
                    Contact = player.Contact;
                    id = Contact.Id;
                }
            }
            var batStatsHelper = new BatStatsHelper(c.Db);
            BatStats = batStatsHelper.GetBatPlayerCareer(id, isIdSeasonId);
            BatStatsTotals = batStatsHelper.GetBatPlayerCareerTotal(id, isIdSeasonId);

            var pitchStatsHelper = new PitchStatsHelper(c.Db);
            PitchStats = pitchStatsHelper.GetPitchPlayerCareer(id, isIdSeasonId);
            PitchStatsTotals = pitchStatsHelper.GetPitchPlayerCareerTotal(id, isIdSeasonId);

            string userId = Globals.GetCurrentUserId();
            if (!string.IsNullOrEmpty(userId) && Contact != null && Contact.UserId == userId)
            {
                OtherAccounts = (from contact in Controller.Db.Contacts
                                 join a in Controller.Db.Accounts on contact.CreatorAccountId equals a.Id
                                 where contact.UserId == userId && contact.CreatorAccountId != AccountId
                                 select new AccountWithContactId()
                                 {
                                     Account = a,
                                     ContactId = contact.Id
                                 });
            }

        }

        public IQueryable<CareerBatStatsViewModel> BatStats { get; private set; }
        public CareerBatStatsViewModel BatStatsTotals { get; private set; }

        public IQueryable<CareerPitchStatsViewModel> PitchStats { get; private set; }
        public CareerPitchStatsViewModel PitchStatsTotals { get; private set; }

        public Contact Contact { get; set; }

        public IQueryable<AccountWithContactId> OtherAccounts { get; }
    }
}