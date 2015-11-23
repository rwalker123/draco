using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class FlightsViewModel : AccountViewModel
    {
        public FlightsViewModel(DBController c, long accountId, long seasonId) : base(c, accountId)
        {
            var flights = c.Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
            Flights = Mapper.Map<IQueryable<LeagueSeason>, IEnumerable<FlightViewModel>>(flights);
        }

        public IEnumerable<FlightViewModel> Flights
        {
            get;
        }
    }
}