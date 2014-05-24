using ModelObjects;
using SportsManager;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Security;
using System.Xml;

namespace DataAccess
{
    /// <summary>
    /// Summary description for ContactRoles
    /// </summary>
    static public class ContactRoles
    {
        static public String GetAdminAccountId()
        {
            DB db = DBConnection.GetContext();
            return (from r in db.AspNetRoles
                    where r.Name == "AccountAdmin"
                    select r.Id).Single();
        }

        static public String GetAccountPhotoAdminId()
        {
            DB db = DBConnection.GetContext();
            return (from r in db.AspNetRoles
                    where r.Name == "AccountPhotoAdmin"
                    select r.Id).Single();
        }

        static public String GetLeagueAdminId()
        {
            DB db = DBConnection.GetContext();
            return (from r in db.AspNetRoles
                    where r.Name == "LeagueAdmin"
                    select r.Id).Single();
        }

        static public String GetTeamAdminId()
        {
            DB db = DBConnection.GetContext();
            return (from r in db.AspNetRoles
                    where r.Name == "TeamAdmin"
                    select r.Id).Single();
        }

        static public String GetTeamPhotoAdminId()
        {
            DB db = DBConnection.GetContext();
            return (from r in db.AspNetRoles
                    where r.Name == "TeamPhotoAdmin"
                    select r.Id).Single();
        }

        static public string GetRoleDataName(string role, long data)
        {
            string roleDataName = string.Empty;

            if (role.Equals("AccountAdmin") || role.Equals("PhotoAdmin"))
            {
                roleDataName = DataAccess.Accounts.GetAccountName(data);
            }
            else if (role.Equals("LeagueAdmin"))
            {
                roleDataName = DataAccess.Leagues.GetLeagueName(data);
            }
            else if (role.Equals("TeamAdmin") || role.Equals("TeamPhotoAdmin"))
            {
                roleDataName = Teams.GetTeamName(DataAccess.Teams.GetTeamSeasonIdFromId(data));
            }

            return roleDataName;
        }

        static public bool IsPhotoAdmin(long accountId, String userId)
        {
            return (DataAccess.ContactRoles.IsContactInRole(accountId, userId, GetAdminAccountId()) ||
                    DataAccess.ContactRoles.IsContactInRole(accountId, userId, GetAccountPhotoAdminId()));
        }

        static public List<RoleData> GetRoleData(long accountId, string role)
        {
            List<RoleData> roleData = new List<RoleData>();

            if (role.Equals("AccountAdmin") || role.Equals("PhotoAdmin"))
            {
                ModelObjects.Account curAccount = DataAccess.Accounts.GetAccount(accountId);
                if (curAccount != null)
                    roleData.Add(new RoleData(curAccount.AccountName, curAccount.Id));
            }
            else if (role.Equals("LeagueAdmin"))
            {
                IEnumerable<League> leagues = Leagues.GetLeagues(DataAccess.Seasons.GetCurrentSeason(accountId));

                foreach (League l in leagues)
                {
                    roleData.Add(new RoleData(l.Name, l.Id));
                }

            }
            else if (role.Equals("TeamAdmin") || role.Equals("TeamPhotoAdmin"))
            {
                var teams = Teams.GetAccountTeams(accountId);

                foreach (var t in teams)
                {
                    roleData.Add(new RoleData(t.Name, t.TeamId));
                }
            }

            return roleData;
        }

        static public bool IsContactInRole(long accountId, String aspNetUserId, String roleId)
        {
            var roles = GetContactRoles(accountId, aspNetUserId);
            if (roles == null)
                return false;

            return (from r in roles
                    where r.RoleId == roleId
                    select r).Any();
        }

        static public IQueryable<SportsManager.Model.ContactRole> GetContactRoles(long accountId, String aspNetUserId)
        {
            if (String.IsNullOrEmpty(aspNetUserId))
                return null;

            DB db = DBConnection.GetContext();

            var contactId = (from c in db.Contacts
                             where c.UserId == aspNetUserId
                             select c.Id).SingleOrDefault();

            if (contactId == 0)
                return null;

            return (from cr in db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        static public IQueryable<SportsManager.Model.ContactRole> GetContactRoles(long accountId, long contactId)
        {
            DB db = DBConnection.GetContext();
            return (from cr in db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        static public IQueryable<ModelObjects.ContactNameRole> ContactNamesFromRole(long accountId, string roleId)
        {
            DB db = DBConnection.GetContext();

            // account admins are not bound by seasons.
            if (roleId == GetAdminAccountId() || roleId == GetAccountPhotoAdminId())
            {
                return (from cr in db.ContactRoles
                        join c in db.Contacts on cr.ContactId equals c.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId
                        select new ContactNameRole()
                        {
                            Id = c.Id,
                            FirstName = c.FirstName,
                            LastName = c.LastName,
                            MiddleName = c.MiddleName,
                            PhotoURL = Contact.GetPhotoURL(c.Id),
                            RoleData = cr.RoleData,
                            RoleId = cr.RoleId,
                            RoleDataText = ""
                        });
            }
            else if (roleId == GetLeagueAdminId())
            {
                long currentSeason = DataAccess.Seasons.GetCurrentSeason(accountId);

                return (from cr in db.ContactRoles
                        join c in db.Contacts on cr.ContactId equals c.Id
                        join ls in db.LeagueSeasons on cr.RoleData equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId && 
                        ls.Id == cr.RoleData && ls.SeasonId == currentSeason
                        select new ContactNameRole()
                        {
                            Id = c.Id,
                            FirstName = c.FirstName,
                            LastName = c.LastName,
                            MiddleName = c.MiddleName,
                            PhotoURL = Contact.GetPhotoURL(c.Id),
                            RoleData = cr.RoleData,
                            RoleId = cr.RoleId,
                            RoleDataText = ls.League.Name
                        });
            }
            else if (roleId == GetTeamAdminId() || roleId == GetTeamPhotoAdminId())
            {
                long currentSeason = DataAccess.Seasons.GetCurrentSeason(accountId);

                return (from cr in db.ContactRoles
                        join c in db.Contacts on cr.ContactId equals c.Id
                        join ts in db.TeamsSeasons on cr.RoleData equals ts.Id
                        join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        ts.Id == cr.RoleData && ls.SeasonId == currentSeason
                        select new ContactNameRole()
                        {
                            Id = c.Id,
                            FirstName = c.FirstName,
                            LastName = c.LastName,
                            MiddleName = c.MiddleName,
                            PhotoURL = Contact.GetPhotoURL(c.Id),
                            RoleData = cr.RoleData,
                            RoleId = cr.RoleId,
                            RoleDataText = ls.League.Name + " " + ts.Name
                        });

            }

            return null;
        }

        static public IQueryable<SportsManager.Model.ContactRole> GetAccountContactsFromRole(long accountId, String roleId)
        {
            List<ContactRole> contactRoles = new List<ContactRole>();

            DB db = DBConnection.GetContext();
            string roleName = (from r in db.AspNetRoles
                               where r.Id == roleId
                               select r.Name).SingleOrDefault();

            if (roleName == "AccountAdmin")
            {
                return (from cr in db.ContactRoles
                        where cr.RoleId == roleId && cr.AccountId == accountId
                        select cr);
            }
            else if (roleName == "LeagueAdmin")
            {
                var leagueIds = (from l in db.Leagues
                                 where l.AccountId == accountId
                                 select l.Id);

                return (from cr in db.ContactRoles
                        where cr.RoleId == roleId && cr.AccountId == accountId &&
                        leagueIds.Contains(cr.RoleData)
                        select cr);
            }
            else if (roleName == "TeamAdmin")
            {
                var teamIds = (from t in db.Teams
                               where t.AccountId == accountId
                               select t.Id);

                return (from cr in db.ContactRoles
                        where cr.RoleId == roleId && cr.AccountId == accountId &&
                        teamIds.Contains(cr.RoleData)
                        select cr);
            }
            else if (roleName == "TeamPhotoAdmin")
            {
                var teamIds = (from t in db.Teams
                               where t.AccountId == accountId
                               select t.Id);

                return (from cr in db.ContactRoles
                        where cr.RoleId == roleId && cr.AccountId == accountId &&
                        teamIds.Contains(cr.RoleData)
                        select cr);
            }
            else if (roleName == "PhotoAdmin")
            {
                return (from cr in db.ContactRoles
                        where cr.RoleId == roleId && cr.AccountId == accountId
                        select cr);
            }

            return null;
        }

        static public long AddContactRole(long accountId, SportsManager.Model.ContactRole c)
        {
            DB db = DBConnection.GetContext();

            var dbRole = (from cr in db.ContactRoles
                            where cr.AccountId == c.AccountId && cr.ContactId == c.ContactId &&
                            cr.RoleId == c.RoleId && cr.RoleData == c.RoleData
                            select cr).SingleOrDefault();
            if (dbRole != null)
                return dbRole.Id;

            db.ContactRoles.InsertOnSubmit(c);
            db.SubmitChanges();

            return c.Id;
        }

        static public bool ModifyContactRole(ContactRole c)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.ContactRole dbContactRole = (from cr in db.ContactRoles
                                                             where cr.Id == c.Id
                                                             select cr).SingleOrDefault();
            if (dbContactRole == null)
                return false;
                
            dbContactRole.Id = c.Id;
            dbContactRole.ContactId = (int)c.ContactId;
            dbContactRole.RoleId = c.RoleId;
            dbContactRole.RoleData = c.RoleData;
            dbContactRole.AccountId = c.AccountId;

            db.SubmitChanges();

            return true;
        }

        static public bool RemoveContactRole(long accountId, string roleId, long contactId, long roleData)
        {
            DB db = DBConnection.GetContext();

            var dbContactRole = (from cr in db.ContactRoles
                                 where cr.AccountId == accountId && cr.RoleId == roleId && cr.ContactId == contactId && cr.RoleData == roleData
                                 select cr).SingleOrDefault();
            if (dbContactRole == null)
                return false;

            db.ContactRoles.DeleteOnSubmit(dbContactRole);
            db.SubmitChanges();

            return true;
        }
    }
}