using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class TeamManagerViewModel
    {
        public long Id { get; set; }
        public long TeamSeasonId { get; set; }
        public long ContactId { get; set; }

        public String TeamName { get; set; }
        public String LeagueName { get; set; }
        public String ContactName { get; set; }
    }
}