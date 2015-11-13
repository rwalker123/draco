using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.API
{
    public class PlayoffSeedViewModel
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayoffId { get; set; } // PlayoffId
        public long TeamId { get; set; } // TeamId
        public int SeedNo { get; set; } // SeedNo

        public string TeamName
        {
            get
            {
                return DataAccess.Teams.GetTeamName(TeamId);
            }
        }

    }
}