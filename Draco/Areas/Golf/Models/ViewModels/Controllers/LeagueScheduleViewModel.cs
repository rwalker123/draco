using AutoMapper;
using Microsoft.AspNet.Identity;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class LeagueScheduleViewModel
    {
        public LeagueScheduleViewModel(IDb db, long accountId, long flightId)
        {
            var completedMatches = db.GetCompletedMatches(flightId);

            CompletedMatches = Mapper.Map<IQueryable<GolfMatch>, IEnumerable<GolfMatchViewModel>>(completedMatches);

            var upcomingMatches = db.GetNotCompletedMatches(flightId);

            UpcomingMatches = Mapper.Map<IQueryable<GolfMatch>, IEnumerable<GolfMatchViewModel>>(upcomingMatches);

            IsAdmin = db.IsAccountAdmin(accountId, HttpContext.Current.User.Identity.GetUserId());
            AccountId = accountId;
            FlightId = flightId;
        }

        public IEnumerable<GolfMatchViewModel> CompletedMatches { get; private set; }
        public IEnumerable<GolfMatchViewModel> UpcomingMatches { get; private set; }

        private long AccountId { get; set; }
        private long FlightId { get; set; }

        public bool IsAdmin
        {
            get;
        }
    }

}