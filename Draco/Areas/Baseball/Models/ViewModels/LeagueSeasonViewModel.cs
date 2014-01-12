using SportsManager.ViewModels;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueSeasonViewModel 
    {
        public LeagueSeasonViewModel(long accountId)
        {
            AccountId = accountId;
        }

        [ScaffoldColumn(false)]
        public long AccountId
        {
            get;
            set;
        }

        // id of league season
        [ScaffoldColumn(false)]
        public long Id
        {
            get;
            set;
        }

        public string Name
        {
            get;
            set;
        }
    }
}