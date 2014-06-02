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
        public PlayerViewModel(Controller c, long accountId, long id, bool isIdSeasonId = false)
            : base(c, accountId)
        {
            if (isIdSeasonId)
            {
                var player = DataAccess.TeamRoster.GetPlayer(id);
                if (player != null)
                    Contact = player.Contact;
            }
            else
                Contact = DataAccess.Contacts.GetContact(id);

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