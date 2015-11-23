using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class GolfMatchViewModel 
    {
        public GolfMatchViewModel()
        {
        }

        [ScaffoldColumn(false)]
        public long MatchId { get; set; }

        [DisplayFormat(DataFormatString = "{0:t}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Time), DisplayName("Match Time")]
        public DateTime MatchTime { get; set; }

        [ScaffoldColumn(false)]
        public int MatchStatus { get; set; }

        [DisplayFormat(DataFormatString = "{0:d}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Date), DisplayName("Match Date")]
        public DateTime MatchDate { get; set; }

        [ScaffoldColumn(false), DisplayName("Team 1")]
        public string Team1Name { get; set; }

        [ScaffoldColumn(false), DisplayName("Team 2")]
        public string Team2Name { get; set; }

        [ScaffoldColumn(false), DisplayName("Course")]
        public string CourseName { get; set; }

        [UIHint("CoursesDropDown"), DisplayName("Course")]
        public long CourseId { get; set; }

        [UIHint("TeamsDropDown"), DisplayName("Team 1")]
        public long Team1 { get; set; }

        [UIHint("TeamsDropDown"), DisplayName("Team 2")]
        public long Team2 { get; set; }

        [UIHint("MatchTypeDropDown"), DisplayName("Match Type")]
        public int MatchType { get; set; }

        [ScaffoldColumn(false)]
        public bool IsComplete { get { return MatchStatus == 1; } }

        [ScaffoldColumn(false)]
        public long FlightId { get; set; }

        private class TempDb : IDb
        {
            public TempDb()
            {
                Db = DependencyResolver.Current.GetService<DB>();
            }

            public DB Db
            {
                get;
            }
        }

        public DateTime GetMostRecentUncompletedDate(long flightId)
        {
            var t = new TempDb();
            return t.GetMostRecentUncompletedDate(flightId);   
        }
    }
}