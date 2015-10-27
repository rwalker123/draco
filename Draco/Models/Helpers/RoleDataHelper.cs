using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Models.Helpers
{
    public static class RoleDataHelper
    {
        private class CurrentDb : IDb
        {
            public CurrentDb()
            {
                Db = DependencyResolver.Current.GetService<DB>();
            }

            public DB Db { get; }
        }

        public static String GetRoleDataText(ContactRole contactRole)
        {
            var db = new CurrentDb();

            if (contactRole.RoleId == db.GetAdminAccountId() || contactRole.RoleId == db.GetAccountPhotoAdminId())
            {
                return "";
            }
            else if (contactRole.RoleId == db.GetLeagueAdminId())
            {
                return (from ls in db.Db.LeagueSeasons
                        where ls.Id == contactRole.RoleData
                        select ls.League.Name).SingleOrDefault();
            }
            else if (contactRole.RoleId == db.GetTeamAdminId() || contactRole.RoleId == db.GetTeamPhotoAdminId())
            {
                return (from ts in db.Db.TeamsSeasons
                        join ls in db.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where ts.Id == contactRole.RoleData
                        select ls.League.Name + " " + ts.Name).SingleOrDefault();
            }

            return null;
        }
    }
}