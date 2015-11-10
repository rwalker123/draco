using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Models.Helpers
{
    public static class DBHelper
    {
        private class HelperDB : IDb
        {
            DB _db;
            public HelperDB()
            {
                _db = DependencyResolver.Current.GetService<DB>();
            }

            public DB Db
            {
                get
                {
                    return _db;
                }
            }
        }

        static public string GetTeamName(long teamId)
        {
            var db = new HelperDB();
            var team = db.Db.Teams.Find(teamId);
            if (team == null)
                return null;

            var currentSeason = db.GetCurrentSeasonId(team.AccountId);
            if (currentSeason == 0)
                return null;

            var currentLeagues = db.Db.LeagueSeasons.Where(ls => ls.SeasonId == currentSeason).Select(ls => ls.Id);

            var teamSeason = db.Db.TeamsSeasons.Where(ts => ts.TeamId == team.Id && currentLeagues.Contains(ts.LeagueSeasonId)).SingleOrDefault();
            if (teamSeason == null)
                return null;

            return (from ls in db.Db.LeagueSeasons
                    join l in db.Db.Leagues on ls.LeagueId equals l.Id
                    where ls.Id == teamSeason.LeagueSeasonId
                    select l.Name + " " + teamSeason.Name).SingleOrDefault();
        }
    }
}
