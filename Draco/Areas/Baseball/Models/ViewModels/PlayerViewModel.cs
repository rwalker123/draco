using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerViewModel : AccountViewModel
    {
        public enum IdType { ContactId, RosterSeasonId, RosterId };

        public PlayerViewModel(Controller c, long accountId, long id, IdType idType)
            : base(c, accountId)
        {
            bool isIdSeasonId = false;

            if (idType == IdType.RosterSeasonId)
            {
                var player = DataAccess.TeamRoster.GetPlayer(id);
                if (player != null)
                    Contact = player.Contact;

                isIdSeasonId = true;
            }
            else if (idType == IdType.ContactId)
            {
                Contact = DataAccess.Contacts.GetContact(id);
            }
            else if (idType == IdType.RosterId)
            {
                var player = DataAccess.TeamRoster.GetPlayerFromId(id);
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