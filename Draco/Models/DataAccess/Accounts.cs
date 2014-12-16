using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Accounts
    /// </summary>
    static public class Accounts
    {
        static public YearListData[] GetAccountYearRange()
        {
            YearListData[] years = new YearListData[100];

            DateTime dt = DateTime.Today;

            for (int i = 0; i < years.Length; ++i)
            {
                years[i] = new YearListData(dt.Year);
                dt = dt.AddYears(-1);
            }

            return years;
        }

        static public String GetAccountFilePath(long accountId)
        {
            Account acc = GetAccount(accountId);
            if (acc != null)
            {
                AccountType accountType = GetAccountType(acc.AccountTypeId);
                if (accountType != null)
                    return accountType.FilePath;
            }

            return String.Empty;
        }

        static public long GetAccountIdFromUrl(string url)
        {
            DB db = DBConnection.GetContext();
            return (from a in db.Accounts
                    where a.URL.Contains(url)
                    select a.Id).SingleOrDefault();
        }


        static public long GetAccountIdFromName(string accountName)
        {
            DB db = DBConnection.GetContext();
            return (from a in db.Accounts
                    where String.Compare(a.Name, accountName, StringComparison.CurrentCultureIgnoreCase) == 0
                    select a.Id).SingleOrDefault();
        }

        static public string GetAccountName(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from a in db.Accounts
                    where a.Id == accountId
                    select a.Name).SingleOrDefault();
        }

        static public long GetAccountTypeFromAccountId(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.Id == accountId
                    select a.AccountTypeId).SingleOrDefault();
        }

        static public ModelObjects.Account GetAccount(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.Id == accountId
                    select a).SingleOrDefault();
        }

        static public bool IsValidAccountName(long accountId, string accountName)
        {
            bool validAccountName = true;

            // remove all spaces from names and then do a case insensitive
            // compare.
            string compareAccount = accountName.ToLower();

            // reserved names
            if (compareAccount == "administrator")
            {
                return false;
            }
            else if (accountName.IndexOfAny(System.IO.Path.GetInvalidFileNameChars()) > -1 ||
                      accountName.IndexOfAny(System.IO.Path.GetInvalidPathChars()) > -1)
            {
                return false;
            }

            compareAccount = compareAccount.Replace(" ", String.Empty);

            IEnumerable<Account> accounts = GetAccounts();
            foreach (Account a in accounts)
            {
                string compareWithAccount = a.Name.ToLower();
                compareWithAccount = compareWithAccount.Replace(" ", String.Empty);

                if (compareAccount == compareWithAccount && a.Id != accountId)
                {
                    validAccountName = false;
                    break;
                }
            }

            return validAccountName;
        }

        static public bool IsAccountOwner(long accountId)
        {
            Account account = GetAccount(accountId);
            if (account != null)
            {
                DB db = DBConnection.GetContext();

                string userId = Globals.GetCurrentUserId();

                var contactId = (from c in db.Contacts
                                 where c.UserId == userId
                                 select c.Id).SingleOrDefault();

                return (account.OwnerId == contactId);
            }

            return false;
        }

        static public bool IsAccountAdmin(long accountId, string userId)
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
                        DB db = DBConnection.GetContext();

                        var roleId = DataAccess.ContactRoles.GetAdminAccountId();
                        var roles = DataAccess.ContactRoles.GetContactRoles(accountId, userId);
                        if (roles != null)
                            rc = (from r in roles
                                  where r.RoleId == roleId && r.AccountId == accountId
                                  select r).Any();
                    }
                }
            }

            return rc;
        }

        static public AccountType GetAccountType(long aId)
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    join at in db.AccountTypes on a.AccountTypeId equals at.Id
                    where a.Id == aId
                    select new AccountType(at.Id, at.Name, at.FilePath)).SingleOrDefault();
        }

        static public IEnumerable<Account> GetAccounts()
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    select a);
        }


        static public bool ModifyAccount(Account account)
        {
            // verify account name is good.
            long id = GetAccountIdFromName(account.Name);
            if (id == 0)
            {
                if (!IsValidAccountName(account.Id, account.Name))
                    throw new Exception("Invalid account name");
            }
            else if (id != account.Id)
            {
                throw new Exception("Account name already used.");
            }

            DB db = DBConnection.GetContext();
            db.Accounts.Attach(account);
            db.Entry(account).State = System.Data.Entity.EntityState.Modified;
            db.SaveChanges();
            return true;
        }

        static public long AddAccount(Account account)
        {
            if (account.OwnerId <= 0)
                throw new ArgumentException("OwnerContactId");

            DB db = DBConnection.GetContext();
            db.Accounts.Add(account);
            db.SaveChanges();

            return account.Id;
        }

        static public async Task<bool> RemoveAccount(Account account)
        {
            DB db = DBConnection.GetContext();

            await Seasons.RemoveAccountSeasons(account.Id);

            string accountName = Accounts.GetAccountName(account.Id);

            var messageCategories = (from mc in db.MessageCategory
                                     where mc.IsTeam == false && mc.AccountId == account.Id
                                     select mc);
            db.MessageCategory.RemoveRange(messageCategories);

            var workoutAnnouncments = (from wa in db.WorkoutAnnouncement
                                       where wa.AccountId == account.Id
                                       select wa);
            db.WorkoutAnnouncement.RemoveRange(workoutAnnouncments);

            var profileCats = (from pc in db.ProfileCategory
                               where pc.AccountId == account.Id
                               select pc);
            db.ProfileCategory.RemoveRange(profileCats);

            var curSeason = (from cs in db.CurrentSeason
                             where cs.AccountId == account.Id
                             select cs);
            db.CurrentSeason.RemoveRange(curSeason);

            var rosters = (from r in db.Roster
                           where r.AccountId == account.Id
                           select r);
            db.Roster.RemoveRange(rosters);

            var leagues = (from l in db.League
                           where l.AccountId == account.Id
                           select l);
            db.League.RemoveRange(leagues);

            var accounts = (from a in db.Accounts
                            where a.Id == account.Id
                            select a);
            db.Accounts.RemoveRange(accounts);

            //Exec RemoveUnusedContacts @Id

            db.SaveChanges();

            // remove uploads directory for account
            System.Web.HttpContext context = System.Web.HttpContext.Current;
            if (context != null)
            {
                await Storage.Provider.DeleteDirectory(Globals.UploadDirRoot + "Accounts/" + account.Id);
            }

            return true;
        }

        static public IQueryable<AccountWelcome> GetAccountWelcomeTextHeaders(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from aw in db.AccountWelcome
                    where aw.AccountId == accountId && (!aw.TeamId.HasValue || aw.TeamId == 0)
                    orderby aw.OrderNo
                    select aw);
        }

        static public IQueryable<AccountWelcome> GetAccountWelcomeText(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from aw in db.AccountWelcome
                    where aw.AccountId == accountId && (!aw.TeamId.HasValue || aw.TeamId == 0)
                    orderby aw.OrderNo
                    select aw);
        }

        static public AccountWelcome GetWelcomeText(long id)
        {
            DB db = DBConnection.GetContext();

            return (from aw in db.AccountWelcome
                    where aw.Id == id
                    select aw).SingleOrDefault();
        }

        static public bool ModifyWelcomeText(AccountWelcome accountWelcome)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.AccountWelcome dbAw = (from aw in db.AccountWelcomes
                                                       where aw.Id == accountWelcome.Id
                                                       select aw).SingleOrDefault();
            if (dbAw != null)
            {
                // don't want to overwrite teamId, it isn't changeable.
                var teamId = dbAw.TeamId;
                accountWelcome.CopyTo(dbAw);
                dbAw.TeamId = teamId;
                db.SubmitChanges();
                return true;
            }

            return false; // not found
        }

        static public void AddWelcomeText(AccountWelcome aw)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.AccountWelcome dbAw = aw.ToDBType();

            db.AccountWelcomes.InsertOnSubmit(dbAw);
            db.SubmitChanges();

            aw.Id = dbAw.Id;
        }

        static public void RemoveWelcomeText(long welcomeId)
        {
            DB db = DBConnection.GetContext();

            var dbAw = (from aw in db.AccountWelcomes
                        where aw.Id == welcomeId
                        select aw).SingleOrDefault();
            if (dbAw != null)
            {
                db.AccountWelcomes.DeleteOnSubmit(dbAw);
                db.SubmitChanges();
            }
        }

        static public void SetAccountSetting(long accountId, string key, string value)
        {
            DB db = DBConnection.GetContext();
            var setting = (from a in db.AccountSettings
                           where a.AccountId == accountId && a.SettingKey == key
                           select a).SingleOrDefault();
            if (setting != null)
            {
                setting.SettingValue = value;
            }
            else
            {
                SportsManager.Model.AccountSetting s = new SportsManager.Model.AccountSetting();
                s.AccountId = accountId;
                s.SettingKey = key;
                s.SettingValue = value;
                db.AccountSettings.InsertOnSubmit(s);
            }

            db.SubmitChanges();
        }

        static public AccountSettings GetAccountSettings(long accountId)
        {
            DB db = DBConnection.GetContext();

            AccountSettings accSettings = new AccountSettings(accountId);

            var dbAccSettings = (from a in db.AccountSettings
                               where a.AccountId == accountId
                               select a);

            foreach(var dbAcc in dbAccSettings)
            {
                accSettings.AddSetting(dbAcc.SettingKey, dbAcc.SettingValue);
            }
            return accSettings;
        }

        static public string GetAccountSetting(long accountId, string key)
        {
            DB db = DBConnection.GetContext();

            string accSetting = Boolean.FalseString;

            var dbAccSetting = (from a in db.AccountSettings
                                where a.AccountId == accountId && a.SettingKey == key
                                select a).SingleOrDefault();
            
            if (dbAccSetting != null)
            {
                accSetting = dbAccSetting.SettingValue;
            }

            return accSetting;
        }

        static public DateTime GetLocalizedTimeForCurrentAccount(long accountId, DateTime utcTime)
        {
            Account currentAccount = DataAccess.Accounts.GetAccount(accountId);

            if (currentAccount == null)
                return utcTime;

            TimeZoneInfo tzi = currentAccount.TimeZoneInfo;
            if (tzi == null)
                return utcTime;

            TimeSpan utcOffset = tzi.GetUtcOffset(utcTime);

            return utcTime.Add(utcOffset);
        }

        static public Account GetIndividualAccount(ModelObjects.Account.AccountType accountType)
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    where a.AccountTypeId == (long)accountType
                    select new Account()
                    {
                        Id = a.Id,
                        AccountTypeId = a.AccountTypeId,
                        AffiliationId = a.AffiliationId,
                        AccountName = a.Name,
                        AccountURL = a.URL,
                        FirstYear = a.FirstYear,
                        TimeZoneId = a.TimeZoneId,
                        OwnerContactId = a.OwnerId
                    }).SingleOrDefault();
        }

        public static void AddAccountUrl(long accountId, string url)
        {
            DB db = DBConnection.GetContext();

            var account = (from a in db.Accounts
                           where a.Id == accountId
                           select a).Single();

            if (!String.IsNullOrWhiteSpace(account.URL))
                account.URL += ";";
            
            account.URL += url;
            account.URL = account.URL.Replace(";;", ";").TrimEnd(new char[] { ';' }).TrimStart(new char[] { ';' });
            db.SubmitChanges();
        }

        public static void DeleteAccountUrl(long accountId, string url)
        {
            DB db = DBConnection.GetContext();

            var account = (from a in db.Accounts
                           where a.Id == accountId
                           select a).Single();

            if (account.URL.Contains(url))
            {
                account.URL = account.URL.Replace(url, String.Empty).Replace(";;", ";").TrimEnd(new char[] { ';' }).TrimStart(new char[] { ';' });
            }

            db.SubmitChanges();
        }
    }
}
