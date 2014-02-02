using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;

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
                        TwitterAccountName = a.TwitterAccountName
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
                // first check to see if this user is an owner of the account.
                rc = IsAccountOwner(accountId);

                // if not the owner, see if user was given the account admin role.
                if (!rc)
                {
                    DB db = DBConnection.GetContext();
                    var roleId = (from r in db.AspNetRoles
                                    where r.Name == "AccountAdmin"
                                    select r.Id).SingleOrDefault();

                    var roles = DataAccess.ContactRoles.GetContactRoles(accountId, userId);
                    if (roles != null)
                        rc = (from r in roles
                              where r.RoleId == roleId && r.RoleData == accountId
                              select r).Any();
                }
            }

            return rc;
        }

        static public string GetAccountTypeName(long accountTypeId)
        {
            string accountTypeName = string.Empty;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetAccountTypeName", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = accountTypeId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        accountTypeName = dr.GetString(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return accountTypeName;
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

        static public bool RemoveAccount(Account account)
        {
            int rowCount = 0;

            Seasons.RemoveAccountSeasons(account.Id);

            string accountName = Accounts.GetAccountName(account.Id);

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteAccount", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = account.Id;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();

                    // remove uploads directory for account
                    System.Web.HttpContext context = System.Web.HttpContext.Current;
                    if (context != null)
                    {
                        string dirToRemove = context.Server.MapPath(ConfigurationManager.AppSettings["UploadDir"]) + account.Id;
                        DirectoryInfo di = new DirectoryInfo(dirToRemove);
                        if (di.Exists)
                            di.Delete(true);
                    }

                    // delete configuration data for account
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount > 0);
        }

        static public IEnumerable<AccountWelcome> GetAccountWelcomeText(long accountId)
        {
            List<AccountWelcome> welcomeText = new List<AccountWelcome>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetAccountWelcomeText", myConnection);
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = accountId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        welcomeText.Add(new AccountWelcome(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt16(2), dr.GetString(3), dr.GetString(4)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return welcomeText;
        }

        static public AccountWelcome GetWelcomeText(long id)
        {
            AccountWelcome welcomeText = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetWelcomeText", myConnection);
                    myCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        welcomeText = new AccountWelcome(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt16(2), dr.GetString(3), dr.GetString(4));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return welcomeText;
        }

        static public List<AccountWelcome> GetWelcomeTexts()
        {
            List<AccountWelcome> welcomeText = new List<AccountWelcome>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetAccountWelcomeTexts", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myConnection.Open();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        welcomeText.Add(new AccountWelcome(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt16(2), dr.GetString(3), dr.GetString(4)));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return welcomeText;
        }

        static public bool ModifyWelcomeText(AccountWelcome accountWelcome)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.AccountWelcome dbAw = (from aw in db.AccountWelcomes
                                                       where aw.Id == accountWelcome.Id
                                                       select aw).SingleOrDefault();
            if (dbAw != null)
            {
                accountWelcome.CopyTo(dbAw);
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
            AccountSettings accSettings = new AccountSettings(accountId);

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetAccountSettings", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@AccountId", SqlDbType.BigInt).Value = accountId;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        accSettings.AddSetting(dr.GetString(1), dr.GetString(2));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return accSettings;
        }

        static public string GetAccountSetting(long accountId, string key)
        {
            string accSetting = Boolean.TrueString;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetAccountSetting", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@AccountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.Parameters.Add("@SettingKey", SqlDbType.VarChar, 25).Value = key;

                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        accSetting = dr.GetString(2);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
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
            account.URL = account.URL.Replace(";;", ";").TrimEnd(new char[] { ';' });
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
                account.URL = account.URL.Replace(url, String.Empty).Replace(";;", ";").TrimEnd(new char[] { ';' });
            }

            db.SubmitChanges();
        }
    }
}
