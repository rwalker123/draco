using Microsoft.AspNet.Identity;
using ModelObjects;
using System;
using System.Linq;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public abstract class DBApiController : ApiController
    {
        protected DB m_db;

        protected DBApiController(DB db)
        {
            m_db = db;
        }

        protected bool IsAccountAdmin(long accountId, string userId)
        {
            bool rc = false;

            if (!String.IsNullOrEmpty(userId))
            {
                // check to see if in AspNetUserRoles as Administrator
                try
                {
                    var userManager = Globals.GetUserManager();
                    rc = userManager.IsInRole(userId, "Administrator");
                }
                catch (Exception)
                {
                    rc = false;
                }

                if (!rc)
                {
                    // first check to see if this user is an owner of the account.
                    rc = IsAccountOwner(accountId);

                    // if not the owner, see if user was given the account admin role.
                    if (!rc)
                    {
                        var roleId = (from r in m_db.AspNetRoles
                                      where r.Name == "AccountAdmin"
                                      select r.Id).Single();

                        var contactId = (from c in m_db.Contacts
                                         where c.UserId == userId
                                         select c.Id).SingleOrDefault();

                        if (contactId == 0)
                            return false;

                        var roles = (from cr in m_db.ContactRoles
                                     where cr.ContactId == contactId && cr.AccountId == accountId
                                     select cr);
                        if (roles != null)
                            rc = (from r in roles
                                  where r.RoleId == roleId && r.AccountId == accountId
                                  select r).Any();
                    }
                }
            }

            return rc;
        }

        protected bool IsAccountOwner(long accountId)
        {
            Account account = m_db.Accounts.Find(accountId);
            if (account != null)
            {
                string userId = Globals.GetCurrentUserId();

                var contactId = (from c in m_db.Contacts
                                 where c.UserId == userId
                                 select c.Id).SingleOrDefault();

                return (account.OwnerId == contactId);
            }

            return false;
        }

        protected string GetAccountSetting(long accountId, string key)
        {
            string accSetting = Boolean.FalseString;

            var dbAccSetting = (from a in m_db.AccountSettings
                                where a.AccountId == accountId && a.SettingKey == key
                                select a).SingleOrDefault();

            if (dbAccSetting != null)
            {
                accSetting = dbAccSetting.SettingValue;
            }

            return accSetting;
        }

        protected void SetAccountSetting(long accountId, string key, string value)
        {
            var setting = (from a in m_db.AccountSettings
                           where a.AccountId == accountId && a.SettingKey == key
                           select a).SingleOrDefault();
            if (setting != null)
            {
                setting.SettingValue = value;
            }
            else
            {
                AccountSetting s = new AccountSetting();
                s.AccountId = accountId;
                s.SettingKey = key;
                s.SettingValue = value;
                m_db.AccountSettings.Add(s);
            }

            m_db.SaveChanges();
        }

        protected bool IsPhotoAdmin(long accountId, String userId)
        {
            return (IsContactInRole(accountId, userId, GetAdminAccountId()) ||
                    IsContactInRole(accountId, userId, GetAccountPhotoAdminId()));
        }

        protected String GetLeagueAdminId()
        {
            return (from r in m_db.AspNetRoles
                    where r.Name == "LeagueAdmin"
                    select r.Id).Single();
        }

        protected String GetTeamAdminId()
        {
            return (from r in m_db.AspNetRoles
                    where r.Name == "TeamAdmin"
                    select r.Id).Single();
        }

        protected bool IsContactInRole(long accountId, String aspNetUserId, String roleId)
        {
            var roles = GetContactRoles(accountId, aspNetUserId);
            if (roles == null)
                return false;

            return (from r in roles
                    where r.RoleId == roleId
                    select r).Any();
        }

        protected IQueryable<ContactRole> GetContactRoles(long accountId, String aspNetUserId)
        {
            if (String.IsNullOrEmpty(aspNetUserId))
                return null;

            var contactId = (from c in m_db.Contacts
                             where c.UserId == aspNetUserId
                             select c.Id).SingleOrDefault();

            if (contactId == 0)
                return null;

            return (from cr in m_db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        protected IQueryable<ContactRole> GetContactRoles(long accountId, long contactId)
        {
            return (from cr in m_db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        protected String GetAdminAccountId()
        {
            return (from r in m_db.AspNetRoles
                    where r.Name == "AccountAdmin"
                    select r.Id).Single();
        }

        protected String GetAccountPhotoAdminId()
        {
            return (from r in m_db.AspNetRoles
                    where r.Name == "AccountPhotoAdmin"
                    select r.Id).Single();
        }

        protected String GetTeamPhotoAdminId()
        {
            return (from r in m_db.AspNetRoles
                    where r.Name == "TeamPhotoAdmin"
                    select r.Id).Single();
        }

        protected void RemoveUnusedLeagues(long accountId)
        {
            // get all leagueSeasons with unique leagueId
            var accountLeagues = (from ls in m_db.LeagueSeasons
                                  select ls.LeagueId).Distinct();

            // if no league season is using a leagueId, we can remove it.
            var unusedLeagues = (from l in m_db.Leagues
                                 where l.AccountId == accountId && !accountLeagues.Contains(l.Id)
                                 select l);

            m_db.Leagues.RemoveRange(unusedLeagues);
        }

        protected void RemoveUnusedContacts(long accountId)
        {
            // all places a contactId is used in for the account.
            var contactInRoster = (from r in m_db.Rosters
                                   select r.ContactId).Distinct();
            var contactInHof = (from h in m_db.Hofs
                                select h.ContactId).Distinct();
            var contactInManager = (from m in m_db.TeamSeasonManagers
                                    select m.ContactId).Distinct();

            var unusedContacts = (from c in m_db.Contacts
                                  where c.CreatorAccountId == accountId &&
                                  !contactInRoster.Contains(c.Id) &&
                                  !contactInHof.Contains(c.Id) &&
                                  !contactInManager.Contains(c.Id)
                                  select c);

            m_db.Contacts.RemoveRange(unusedContacts);
        }

        protected long GetCurrentSeasonId(long accountId)
        {
            return m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();
        }

        protected void RemoveLeagueSeason(LeagueSeason ls)
        {
            m_db.DivisionSeasons.RemoveRange(ls.DivisionSeasons);

            foreach (TeamSeason t in ls.TeamsSeasons)
                RemoveSeasonTeam(t);

            m_db.LeagueSeasons.Remove(ls);
        }

        private void RemoveSeasonTeam(TeamSeason t)
        {
            m_db.RosterSeasons.RemoveRange(t.Roster);
            m_db.TeamSeasonManagers.RemoveRange(t.TeamSeasonManagers);
            m_db.GameRecaps.RemoveRange(t.GameRecaps);

            var allGamesForTeam = (from ls in m_db.LeagueSchedules
                                   where ls.HTeamId == t.Id || ls.VTeamId == t.Id
                                   select ls);
            m_db.LeagueSchedules.RemoveRange(allGamesForTeam);
        }

        protected void RemoveUnusedDivisions(long accountId)
        {
            var accountDivisions = (from ds in m_db.DivisionSeasons
                                    select ds.DivisionId).Distinct();

            var unusedDivisions = (from dd in m_db.DivisionDefs
                                   where dd.AccountId == accountId && !accountDivisions.Contains(dd.Id)
                                   select dd);

            m_db.DivisionDefs.RemoveRange(unusedDivisions);
        }

        protected Contact GetCurrentContact()
        {
            String userId = Globals.GetCurrentUserId();
            return m_db.Contacts.Where(c => c.UserId == userId).SingleOrDefault();
        }

    }
}
