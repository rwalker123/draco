using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using ModelObjects;
using SportsManager;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Security;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Contacts
    /// </summary>
    static public class Contacts
    {
        private const String AccountCreatedSubject = "{0} Account Created";
        private const String AccountCreatedBody = "Hello, \n\nA new {0} account has been created for you by {1}. You can use this account to log into the {0} website.\n\nLogin information:\n\n\tUser Name: {2}\n\tPassword: {3}\n\nIf you have any questions, please reply to this email.\n\nThank you,\n\n\n{0}";

        private const String AccountModifiedSubject = "{0} Account Modified";
        private const String AccountModifiedBody = "Hello, \n\nA new email address has been associated with your {0} account by {1}.\n\nYour new email address is: {2}. You will need to use this email when logging onto the site.\n\nIf this change was made in error, please reply to this email.\n\nThank you,\n\n\n{0}";

        private const String AccountPasswordSubject = "{0} Account Password Reset";
        private const String AccountPasswordBody = "Hello,\n\nYour password on {0} has been reset by {1}. Please use this new password the next time you log in.\n\n\tNew Password: {2}\n\nIf you have any questions, please reply to this email.\n\nThank you, \n\n\n{0}";

        static public bool DoesContactExist(long accountId, long contactId, string firstName, string middleName, string lastName)
        {
            DB db = DBConnection.GetContext();
            long affid = (from a in db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affAccounts = (from a in db.Accounts
                               where a.Id == accountId || (affid != 1 && a.AffiliationId == affid)
                               select a.Id);

            return (from c in db.Contacts
                     where String.Compare(firstName, c.FirstName, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                           String.Compare(lastName, c.LastName, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                           ((middleName == null && c.MiddleName == null) || String.Compare(middleName, c.MiddleName, StringComparison.CurrentCultureIgnoreCase) == 0) &&
                           affAccounts.Contains(c.CreatorAccountId)
                     select c).Any();
        }

        static public IQueryable<ContactName> FindContacts(long accountId, string firstName, string lastName)
        {
            DB db = DBConnection.GetContext();

            return (from c in db.Contacts
                    where c.CreatorAccountId == accountId && 
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new ContactName()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id)
                    });
        }

        static public IQueryable<Contact> GetUsers(long accountId)
        {
            DB db = DBConnection.GetContext();
            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var creatorAccounts = (from a in db.Accounts
                                   where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                                       select a.Id);

            return (from c in db.Contacts
                    where !String.IsNullOrEmpty(c.Email) && creatorAccounts.Contains(c.CreatorAccountId)
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName,
                        c.Phone1, c.Phone2, c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City,
                        c.State, c.Zip, c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId));
        }

        static public Contact GetContact(String aspNetUserId)
        {
            if (String.IsNullOrEmpty(aspNetUserId))
                return null;

            DB db = DBConnection.GetContext();

            return (from c in db.Contacts
                    where c.UserId == aspNetUserId
                    select new Contact(
                        c.Id,
                        c.Email,
                        c.LastName,
                        c.FirstName,
                        c.MiddleName,
                        c.Phone1,
                        c.Phone2,
                        c.Phone3,
                        c.CreatorAccountId,
                        c.StreetAddress,
                        c.City,
                        c.State,
                        c.Zip,
                        c.FirstYear.GetValueOrDefault(),
                        c.DateOfBirth,
                        c.UserId)).SingleOrDefault();

        }

        static public Contact GetContact(long contactId)
        {
            DB db = DBConnection.GetContext();

            return (from c in db.Contacts
                    where c.Id == contactId
                    select new Contact(
                        c.Id,
                        c.Email,
                        c.LastName,
                        c.FirstName,
                        c.MiddleName,
                        c.Phone1,
                        c.Phone2,
                        c.Phone3,
                        c.CreatorAccountId,
                        c.StreetAddress,
                        c.City,
                        c.State,
                        c.Zip,
                        c.FirstYear.GetValueOrDefault(),
                        c.DateOfBirth,
                        c.UserId)).SingleOrDefault();
        }
       
        static public IQueryable<ModelObjects.ContactName> GetContactNames(long accountId)
        {
            DB db = DBConnection.GetContext();

            long affId = (from a in db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affiliationAccounts = (from a in db.Accounts
                                       where a.Id == accountId || (affId != 1 && a.AffiliationId == affId)
                                       select a.Id);

            return (from c in db.Contacts
                    where affiliationAccounts.Contains(c.CreatorAccountId)
                    select new ModelObjects.ContactName()
                                                     {
                                                         Id = c.Id,
                                                         FirstName = c.FirstName,
                                                         MiddleName = c.MiddleName,
                                                         LastName = c.LastName,
                                                         PhotoURL = Contact.GetPhotoURL(c.Id)
                                                     });
        }


        static public IQueryable<SportsManager.Model.Contact> GetContacts(long accountId)
        {
            DB db = DBConnection.GetContext();

            long affId = (from a in db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affiliationAccounts = (from a in db.Accounts
                                       where a.Id == accountId || (affId != 1 && a.AffiliationId == affId)
                                       select a.Id);

            return (from c in db.Contacts
                            where affiliationAccounts.Contains(c.CreatorAccountId)
                            select c);
        }

        static public bool SetAccountCreator(long contactId, long accountId)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.SetContactAccountCreator", myConnection);
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = contactId;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;

                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return (rowCount > 0) ? true : false;
        }

        static public long AddContact(Contact c)
        {
            c.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(c.Phone1));
            c.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(c.Phone2));
            c.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(c.Phone3));

            if (c.CreatorAccountId == 0)
                throw new ArgumentException("AccountId");

            DB db = DBConnection.GetContext();

            SportsManager.Model.Contact dbContact = new SportsManager.Model.Contact()
            {
                Id = (int)c.Id,
                Email = c.Email,
                FirstName = c.FirstName,
                LastName = c.LastName,
                MiddleName = c.MiddleName,
                Phone1 = c.Phone1,
                Phone2 = c.Phone2,
                Phone3 = c.Phone3,
                CreatorAccountId = c.CreatorAccountId,
                StreetAddress = c.StreetAddress,
                City = c.City,
                State = c.State,
                Zip = c.Zip,
                FirstYear = c.FirstYear,
                DateOfBirth = c.DateOfBirth,
                IsFemale = c.IsFemale
            };

            db.Contacts.InsertOnSubmit(dbContact);
            db.SubmitChanges();

            c.Id = dbContact.Id;

            if (!String.IsNullOrEmpty(dbContact.Email))
            {
                dbContact.UserId = CreateAndEmailAccount(c.CreatorAccountId, dbContact.Email, forAdd: true);
                if (!String.IsNullOrEmpty(dbContact.UserId))
                {
                    db.SubmitChanges();
                    c.UserId = dbContact.UserId;
                }
            }

            return c.Id;
        }

        static public String GetFirstNameFromUserName(string userName)
        {
            string userId = Globals.GetCurrentUserId();

            DB db = DBConnection.GetContext();
            return (from c in db.Contacts
                    where c.UserId == userId
                    select c.FirstName).SingleOrDefault();
        }

        static public Contact GetContactFromName(long accountId, string firstName, string lastName, string middleName)
        {
            DB db = DBConnection.GetContext();

            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            return (from c in db.Contacts
                    where aIds.Contains(c.CreatorAccountId) &&
                    c.FirstName.Equals(firstName, StringComparison.CurrentCultureIgnoreCase) &&
                    c.LastName.Equals(lastName, StringComparison.CurrentCultureIgnoreCase) &&
                    c.MiddleName.Equals(middleName, StringComparison.CurrentCultureIgnoreCase)
                    select new Contact(c.Id, c.Email, c.LastName, c.FirstName, c.MiddleName, c.Phone1, c.Phone2,
                        c.Phone3, c.CreatorAccountId, c.StreetAddress, c.City, c.State, c.Zip,
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)).SingleOrDefault();
        }

        static public void UpdateContact(Contact contact, bool updateUserId)
        {
            DB db = DBConnection.GetContext();
            var dbContact = (from c in db.Contacts
                             where c.Id == contact.Id
                             select c).SingleOrDefault();
            if (dbContact == null)
                return;

            contact.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone1));
            contact.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone2));
            contact.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone3));

            string origEmail = dbContact.Email;
            string newEmail = contact.Email;

            System.Diagnostics.Debug.Assert(false, "send email if email address changed");

            contact.Copy(dbContact);
            db.SubmitChanges();
        }

        static async public Task<bool> RemoveContact(Contact contact)
        {
            DB db = DBConnection.GetContext();
            var item = (from c in db.Contacts
                        where c.Id == contact.Id
                        select c).SingleOrDefault();

            if (item != null)
            {
                db.Contacts.DeleteOnSubmit(item);
                db.SubmitChanges();

                await AzureStorageUtils.RemoveCloudFile(contact.PhotoURL);
                await AzureStorageUtils.RemoveCloudFile(contact.LargePhotoURL);
                return true;
            }

            return false;
        }

        public static bool RemoveUnusedContacts(long accountId)
        {
            DB db = DBConnection.GetContext();

            // all places a contactId is used in for the account.
            var contactInRoster = (from r in db.Rosters
                                   select r.ContactId).Distinct();
            var contactInHof = (from h in db.hofs
                                select h.ContactId).Distinct();
            var contactInManager = (from m in db.TeamSeasonManagers
                                    select m.ContactId).Distinct();

            var unusedContacts = (from c in db.Contacts
                                  where c.CreatorAccountId == accountId &&
                                  !contactInRoster.Contains(c.Id) &&
                                  !contactInHof.Contains(c.Id) &&
                                  !contactInManager.Contains(c.Id)
                                  select c);

            db.Contacts.DeleteAllOnSubmit(unusedContacts);

            return true;
        }

        public static async Task<bool> DeleteUserAccount(Contact c)
        {
            if (!String.IsNullOrEmpty(c.UserId))
            {
                var userManager = Globals.GetUserManager();
                var user = await userManager.FindByIdAsync(c.UserId);

                if (user != null)
                {
                    //await userManager.DeleteAsync(user);
                }
            }
            return await RemoveContact(c);
        }

        public static bool ResetPassword(ModelObjects.Contact contact)
        {
            if (!String.IsNullOrEmpty(contact.Email))
            {
                MembershipUser user = Membership.GetUser(contact.Email);
                if (user != null)
                {
                    String newPassword = CreateNewPassword(contact);
                    NotifyUserPasswordChange(contact, newPassword);
                    return true;
                }
            }

            return false;
        }

        private static String CreateNewPassword(ModelObjects.Contact contact)
        {
            System.Diagnostics.Debug.Assert(true, "TODO");
            throw new NotImplementedException();
            //string newPassword = Membership.GeneratePassword(8, 2);
            //var token = WebMatrix.WebData.WebSecurity.GeneratePasswordResetToken(contact.UserName, 2);
            //WebMatrix.WebData.WebSecurity.ResetPassword(token, newPassword);
            //return newPassword;
        }

        public static string EncryptVerifyCode(long pendingId, long requesterContactId, long pendingContactId)
        {
            pendingId += 54;
            requesterContactId += 33;
            pendingContactId += 11;

            return pendingId.ToString("0000000000") + requesterContactId.ToString("0000000000") + pendingContactId.ToString("0000000000");
        }

        public static void DecryptVerifyCode(string code, out long pendingId, out long requesterContactId, out long pendingContactId)
        {
            pendingId = 0;
            requesterContactId = 0;
            pendingContactId = 0;

            if (code.Length < 30)
                return;

            string str = code.Substring(0, 10);
            Int64.TryParse(str, out pendingId);
            if (pendingId != 0)
                pendingId -= 54;

            str = code.Substring(10, 10);
            Int64.TryParse(str, out requesterContactId);
            if (requesterContactId != 0)
                requesterContactId -= 33;

            str = code.Substring(20, 10);
            Int64.TryParse(str, out pendingContactId);
            if (pendingContactId != 0)
                pendingContactId -= 11;
        }

        static private void NotifyUserPasswordChange(ModelObjects.Contact contact, string newPassword)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string accountName = DataAccess.Accounts.GetAccountName(contact.CreatorAccountId);
            string subject = String.Format(AccountPasswordSubject, accountName);
            string body = String.Format(AccountPasswordBody, accountName, currentUser, newPassword);
            Globals.MailMessage(currentUser, contact.Email, subject, body);
        }

        static private void NotifyUserOfNewEmail(long accountId, string oldEmail, string newEmail)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string accountName = DataAccess.Accounts.GetAccountName(accountId);
            string subject = String.Format(AccountModifiedSubject, accountName);
            string body = String.Format(AccountModifiedBody, accountName, currentUser, newEmail);
            Globals.MailMessage(currentUser, oldEmail, subject, body);
        }

        static private String CreateAndEmailAccount(long accountId, string email, bool forAdd = false)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return String.Empty;

            var userManager = Globals.GetUserManager();

            // email is set in contacts db, check to see if a user exists in
            // webPages_Membership
            ApplicationUser newUser = null;
            if (!forAdd) // the user data may already exist if this is not a new user.
                newUser = userManager.FindByName(email);

            if (newUser == null)
            {
                string password = Membership.GeneratePassword(8, 2);

                // new way to create user and sign in.
                var user = new ApplicationUser() { UserName = email };
                var result = userManager.Create(user, password);
                if (result.Succeeded)
                {
                    newUser = userManager.FindByName(email);
                    if (newUser != null)
                    {
                        // notify user
                        string accountName = DataAccess.Accounts.GetAccountName(accountId);
                        string subject = String.Format(AccountCreatedSubject, accountName);
                        string body = String.Format(AccountCreatedBody, accountName, currentUser, email, password);
                        Globals.MailMessage(currentUser, email, subject, body);

                        return newUser.Id;
                    }
                }

            }
            else
            {
                NotifyUserOfNewEmail(accountId, email, email);

                return newUser.Id;
            }

            return String.Empty;
        }
    }
}