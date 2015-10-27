using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class LeagueSetupViewModel
    {
        public long Id { get; set; }
        public String Name { get; set; }
        public long SeasonId { get; set; }
    }
}