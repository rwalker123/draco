using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
    public class GolfLeagueSetupViewModel
    {
        public GolfLeagueSetupViewModel(long accountId)
        {
            GolfLeagueSetup golfLeagueSetup = DataAccess.Golf.GolfLeagues.GetLeagueSetup(accountId);

            if (golfLeagueSetup != null)
            {
                LeagueDay = golfLeagueSetup.LeagueDay;
                StartTeeTime = golfLeagueSetup.FirstTeeTime;
                TimeBetweenTeeTimes = golfLeagueSetup.TimeBetweenTeeTimes;
                HolesPerMatch = golfLeagueSetup.HolesPerMatch;
            }
        }

        public GolfLeagueSetup GetSetupFromViewModel(long accountId)
        {
            GolfLeagueSetup gls = new GolfLeagueSetup()
            {
                AccountId = accountId,
                LeagueDay = LeagueDay,
                FirstTeeTime = StartTeeTime,
                TimeBetweenTeeTimes = TimeBetweenTeeTimes,
                HolesPerMatch = HolesPerMatch
            };

            return gls;
        }

        [ScaffoldColumn(false)]
        public long AccountId { get; private set; }

        [UIHint("DayOfWeekSelector"), DisplayName("League Day")]
        public int LeagueDay { get; set; }

        [UIHint("EighteenNineSelector"), DisplayName("HolesPerMatch")]
        public int HolesPerMatch { get; set; }

        [DisplayFormat(DataFormatString = "{0:t}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Time), DisplayName("Start Tee Time")]
        public DateTime StartTeeTime { get; set; }

        [DisplayName("Time Between Tee Times")]
        public int TimeBetweenTeeTimes { get; set; }
    }
}