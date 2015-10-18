using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class BirthdayViewModel : AccountViewModel
    {
        public BirthdayViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            DateTime today = DateTime.Today;
            var birthdays = (from cs in c.Db.CurrentSeasons
                         join ls in c.Db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                         join ts in c.Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                         join rs in c.Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                         join r in c.Db.Rosters on rs.PlayerId equals r.Id
                         join co in c.Db.Contacts on r.ContactId equals co.Id
                         where cs.AccountId == accountId &&
                             !rs.Inactive &&
                             co.DateOfBirth.Day == today.Day &&
                             co.DateOfBirth.Month == today.Month
                         orderby co.LastName, co.FirstName, co.MiddleName
                         select co).Distinct();
            Birthdays = Mapper.Map<IQueryable<Contact>, List<ContactNameViewModel>>(birthdays);
        }

        public IEnumerable<ContactNameViewModel> Birthdays { get; private set; }
    }
}