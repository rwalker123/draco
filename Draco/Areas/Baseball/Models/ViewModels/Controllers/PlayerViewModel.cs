using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerViewModel : AccountViewModel
    {
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
            BatStats = DataAccess.GameStats.GetBatPlayerCareer(id, isIdSeasonId);
            BatStatsTotals = DataAccess.GameStats.GetBatPlayerCareerTotal(id, isIdSeasonId);

            PitchStats = DataAccess.GameStats.GetPitchPlayerCareer(id, isIdSeasonId);
            PitchStatsTotals = DataAccess.GameStats.GetPitchPlayerCareerTotal(id, isIdSeasonId);
        }

        public IQueryable<GameCareerBatStats> BatStats { get; private set; }
        public GameCareerBatStats BatStatsTotals { get; private set; }

        public IQueryable<GameCareerPitchStats> PitchStats { get; private set; }
        public GameCareerPitchStats PitchStatsTotals { get; private set; }

        public Contact Contact { get; set; }

    }
}