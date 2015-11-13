using SportsManager.Golf.Models;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class GolfMatchViewModel 
    {
        public GolfMatchViewModel(long id)
        {
            MatchId = id;

            MatchTime = DateTime.Now;
            MatchDate = DateTime.Now;
        }

        public GolfMatchViewModel(GolfMatch gm)
            : this(gm.Id)
        {
            CourseId = gm.CourseId.GetValueOrDefault(0);
            MatchTime = gm.MatchTime;
            MatchDate = gm.MatchDate;
            MatchType = gm.MatchType;
            MatchStatus = gm.MatchStatus;
            Team1 = gm.Team1;
            Team2 = gm.Team2;
            Team1Name = gm.TeamsSeason_Team1.Name;
            Team2Name = gm.TeamsSeason_Team2.Name;
            CourseName = gm.GolfCourse?.Name;
            FlightId = gm.LeagueId;
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
        public long FlightId { get; private set; }

        internal static GolfMatch GolfMatchFromViewModel(GolfMatchViewModel vm)
        {
            return new GolfMatch()
            {
                Id = vm.MatchId,
                CourseId = vm.CourseId,
                MatchDate = vm.MatchDate,
                MatchTime = vm.MatchTime,
                MatchType = vm.MatchType,
                Team1 = vm.Team1,
                Team2 = vm.Team2,
                MatchStatus = vm.MatchStatus,
                LeagueId = vm.FlightId
            };
        }
    }
}