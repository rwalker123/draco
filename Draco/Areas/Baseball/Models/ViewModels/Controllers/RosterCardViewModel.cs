using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class RosterCardViewModel : AccountViewModel
    {
        public RosterCardViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (Team != null)
            {
                Players = c.Db.RosterSeasons.Where(rs => rs.TeamSeasonId == teamSeasonId && !rs.Inactive).OrderBy(rs => rs.Roster.Contact.LastName).ThenBy(rs => rs.Roster.Contact.FirstName);
                LeagueTeamName = (from ts in c.Db.TeamsSeasons
                                  join ls in c.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                  join l in c.Db.Leagues on ls.LeagueId equals l.Id
                                  where ts.Id == teamSeasonId
                                  select l.Name + " " + ts.Name).SingleOrDefault();
            }
        }

        public String LeagueTeamName { get; set; }
        public TeamSeason Team { get; set; }
        public IQueryable<PlayerSeason> Players { get; set; }
    }
}