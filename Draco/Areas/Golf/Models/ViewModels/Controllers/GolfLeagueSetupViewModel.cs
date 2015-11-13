using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.ViewModels;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class GolfLeagueSetupViewModel : AccountViewModel
    {
        public GolfLeagueSetupViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            GolfLeagueSetup golfLeagueSetup = GetLeagueSetup(accountId);

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

        private GolfLeagueSetup GetLeagueSetup(long accountId)
        {
            var leagueSetup = (from a in Controller.Db.GolfLeagueSetups
                               where a.AccountId == accountId
                               select a).SingleOrDefault();

            if (leagueSetup == null)
            {
                leagueSetup = new GolfLeagueSetup();
                leagueSetup.FirstTeeTime = DateTime.Now;
                leagueSetup.AccountId = accountId;
            }

            return leagueSetup;
        }


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