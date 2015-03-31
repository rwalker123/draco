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
                    return accountType.HomePageFilePath;
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
                    select new Account()
                    {
                        Id = a.Id,
                        AccountTypeId = a.AccountTypeId,
                        AffiliationId = a.AffiliationId,
                        AccountName = a.Name,
                        AccountURL = a.URL,
                        FirstYear = a.FirstYear,
                        TimeZoneId = a.TimeZoneId,
                        OwnerContactId = a.OwnerId,
                        YouTubeUserId = a.YouTubeUserId,
                        TwitterAccountName = a.TwitterAccountName,
                        DefaultVideo = a.DefaultVideo,
                        AutoPlayVideo = a.AutoPlayVideo
                    }).SingleOrDefault();
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
                string compareWithAccount = a.AccountName.ToLower();
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

                return (account.OwnerContactId == contactId);
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

        static public IQueryable<Account> GetAccounts()
        {
            DB db = DBConnection.GetContext();

            return (from a in db.Accounts
                    select new Account()
                    {
                        Id = a.Id,
                        AccountTypeId = a.AccountTypeId,
                        AffiliationId = a.AffiliationId,
                        AccountName = a.Name,
                        AccountURL = a.URL,
                        FirstYear = a.FirstYear,
                        TimeZoneId = a.TimeZoneId,
                        OwnerContactId = a.OwnerId,
                        TwitterAccountName = a.TwitterAccountName
                    });
        }


        static public bool ModifyAccount(Account account)
        {
            // verify account name is good.
            long id = GetAccountIdFromName(account.AccountName);
            if (id == 0)
            {
                if (!IsValidAccountName(account.Id, account.AccountName))
                    throw new Exception("Invalid account name");
            }
            else if (id != account.Id)
            {
                throw new Exception("Account name already used.");
            }

            DB db = DBConnection.GetContext();
            SportsManager.Model.Account dbAccount = (from a in db.Accounts
                                                     where a.Id == account.Id
                                                     select a).SingleOrDefault();
            if (dbAccount != null)
            {
                dbAccount.OwnerId = account.OwnerContactId;
                dbAccount.Name = account.AccountName;
                dbAccount.URL = account.AccountURL;
                dbAccount.FirstYear = account.FirstYear;
                dbAccount.AffiliationId = account.AffiliationId;
                dbAccount.TimeZoneId = account.TimeZoneId;
                dbAccount.YouTubeUserId = account.YouTubeUserId;
                dbAccount.TwitterAccountName = account.TwitterAccountName;
                dbAccount.DefaultVideo = account.DefaultVideo ?? String.Empty;
                dbAccount.AutoPlayVideo = account.AutoPlayVideo;

                db.SubmitChanges();

                return true;
            }

            return false;
        }

        static public long AddAccount(Account account)
        {
            if (account.OwnerContactId <= 0)
                throw new ArgumentException("OwnerContactId");

            DB db = DBConnection.GetContext();

            SportsManager.Model.Account dbAccount = new SportsManager.Model.Account()
            {
                OwnerId = account.OwnerContactId,
                Name = account.AccountName,
                URL = account.AccountURL,
                FirstYear = account.FirstYear,
                AccountTypeId = account.AccountTypeId,
                AffiliationId = account.AffiliationId,
                TimeZoneId = account.TimeZoneId,
                TwitterAccountName = String.Empty,
                FacebookFanPage = String.Empty,
                TwitterOauthSecretKey = String.Empty,
                TwitterOauthToken = String.Empty
            };

            db.Accounts.InsertOnSubmit(dbAccount);
            db.SubmitChanges();

            account.Id = dbAccount.Id;
            return account.Id;
        }

        static public async Task<bool> RemoveAccount(Account account)
        {
            DB db = DBConnection.GetContext();

            await Seasons.RemoveAccountSeasons(account.Id);

            string accountName = Accounts.GetAccountName(account.Id);

            var messageCategories = (from mc in db.MessageCategories
                                     where mc.isTeam == false && mc.AccountId == account.Id
                                     select mc);
            db.MessageCategories.DeleteAllOnSubmit(messageCategories);

            var workoutAnnouncments = (from wa in db.WorkoutAnnouncements
                                       where wa.AccountId == account.Id
                                       select wa);
            db.WorkoutAnnouncements.DeleteAllOnSubmit(workoutAnnouncments);

            var profileCats = (from pc in db.ProfileCategories
                               where pc.AccountId == account.Id
                               select pc);
            db.ProfileCategories.DeleteAllOnSubmit(profileCats);

            var curSeason = (from cs in db.CurrentSeasons
                             where cs.AccountId == account.Id
                             select cs);
            db.CurrentSeasons.DeleteAllOnSubmit(curSeason);

            var rosters = (from r in db.Rosters
                           where r.AccountId == account.Id
                           select r);
            db.Rosters.DeleteAllOnSubmit(rosters);

            var leagues = (from l in db.Leagues
                           where l.AccountId == account.Id
                           select l);
            db.Leagues.DeleteAllOnSubmit(leagues);

            var accounts = (from a in db.Accounts
                            where a.Id == account.Id
                            select a);
            db.Accounts.DeleteAllOnSubmit(accounts);

            //Exec RemoveUnusedContacts @Id

            db.SubmitChanges();

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
            return (from aw in db.AccountWelcomes
                    where aw.AccountId == accountId && (!aw.TeamId.HasValue || aw.TeamId == 0)
                    orderby aw.OrderNo
                    select new AccountWelcome()
                    {
                        Id = aw.Id,
                        AccountId = accountId,
                        TeamId = 0,
                        CaptionText = aw.CaptionMenu,
                        OrderNo = aw.OrderNo,
                        WelcomeText = "" // don't return text.
                    });
        }

        static public IQueryable<AccountWelcome> GetAccountWelcomeText(long accountId)
        {
            DB db = DBConnection.GetContext();
            return (from aw in db.AccountWelcomes
                    where aw.AccountId == accountId && (!aw.TeamId.HasValue || aw.TeamId == 0)
                    orderby aw.OrderNo
                    select new AccountWelcome()
                    {
                        Id = aw.Id,
                        AccountId = accountId,
                        TeamId = 0,
                        CaptionText = aw.CaptionMenu,
                        OrderNo = aw.OrderNo,
                        WelcomeText = aw.WelcomeText
                    });
        }

        static public AccountWelcome GetWelcomeText(long id)
        {
            DB db = DBConnection.GetContext();

            return (from aw in db.AccountWelcomes
                    where aw.Id == id
                    select new AccountWelcome(aw.Id, aw.AccountId, aw.OrderNo, aw.CaptionMenu, aw.WelcomeText)).SingleOrDefault();
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
