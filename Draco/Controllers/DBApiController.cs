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
        public DBApiController(DB db)
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
    }
}
