using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Routing;
using System.Web.Security;

namespace DataAccess
{
    /// <summary>
    /// Summary description for Contacts
    /// </summary>
    static public class Contacts
    {
        private const String AccountCreatedSubject = "{0} Account Created";
        private const String AccountCreatedBody =
        @"<h4>Welcome to the {0}!</h4> 
            <p>A new user account has been created on your behalf by <a href='mailto:{1}'>{4}</a>. You can use this account to log into the {0} website.</p>
            <h3>Login information</h3>
            <p>User Name: {2}</p>
            <p>Password: {3}</p>
            <p>After you login you can change your password by clicking your Name in the upper right corner of the web site.</p>
            <p>If you have any questions, please reply to this email.</p>
            Thank you,<br />
            <br />
            <br />
            {0}";

        private const String AccountModifiedSubject = "{0} Account Modified";
        private const String AccountModifiedBody =
        @"<h4>{0} Account User Name/Email Change Notice</h4>
          <p>A new email address has been associated with your {0} account by <a href='mailto:{1}'>{3}</a>. Your new email address is: {2}.</p>
          <p>This email address is your new <b>user name</b> when logging into the site.</p>
          <p>If this change was made in error, please reply to this email.</p>
          Thank you,<br />
            <br />
            <br />
            {0}";


        private const String AccountPasswordSubject = "{0} Account Password Reset";
        private const String AccountPasswordBody =
            @"<h4>{0} Account Password Reset Notice</h4>
              <p>Your password on {0} has been reset by <a href='mailto:{1}'>{3}</a>.</p>
              <p><a href='{2}'>Click here</a> to continue with resetting your password.</p>
              <p>If you have any questions, please reply to this email.</p>
              Thank you,<br />
              <br />
              <br />
              {0}";

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

            long affiliationId = (from a in db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var creatorAccounts = (from a in db.Accounts
                                   where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                                   select a.Id);


            return (from c in db.Contacts
                    where creatorAccounts.Contains(c.CreatorAccountId) && 
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select new ContactName()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        MiddleName = c.MiddleName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),
                        BirthDate = c.DateOfBirth
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
                        c.State, c.Zip, c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)
                        {
                            IsFemale = c.IsFemale.GetValueOrDefault()
                        });
        }

        static public long GetContactId(String aspNetUserId)
        {
            DB db = DBConnection.GetContext();

            return (from c in db.Contacts
                    where c.UserId == aspNetUserId
                    select c.Id).SingleOrDefault();
        }

        static public String GetContactName(long contactId)
        {
            DB db = DBConnection.GetContext();

            return (from c in db.Contacts
                    where c.Id == contactId
                    select c.FirstName + ' ' + c.LastName).SingleOrDefault();
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
                        c.UserId)
                        {
                            IsFemale = c.IsFemale.GetValueOrDefault()
                        }).SingleOrDefault();

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
                        c.UserId)
                        {
                            IsFemale = c.IsFemale.GetValueOrDefault()
                        }).SingleOrDefault();
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
                    select new ContactName()
                    {
                        Id = c.Id,
                        FirstName = c.FirstName,
                        MiddleName = c.MiddleName,
                        LastName = c.LastName,
                        PhotoURL = Contact.GetPhotoURL(c.Id),
                        FirstYear = c.FirstYear.GetValueOrDefault(),
                        Zip = c.Zip,
                        BirthDate = c.DateOfBirth
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

        static public async Task<long> AddContact(Contact c, bool registerAccount)
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

            if (!String.IsNullOrEmpty(dbContact.Email) && registerAccount)
            {
                dbContact.UserId = await CreateAndEmailAccount(c.CreatorAccountId, dbContact.Email);
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
            String firstName = (from c in db.Contacts
                                where c.UserId == userId
                                select c.FirstName).SingleOrDefault();
            if (String.IsNullOrEmpty(firstName))
                return userName;

            return firstName;
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
                        c.FirstYear.GetValueOrDefault(), c.DateOfBirth, c.UserId)
                        {
                            IsFemale = c.IsFemale.GetValueOrDefault()
                        }).SingleOrDefault();
        }

        static public async Task<String> RegisterUser(Contact c)
        {
            DB db = DBConnection.GetContext();

            var contact = (from con in db.Contacts
                           where con.Id == c.Id
                           select con).SingleOrDefault();

            if (contact == null)
                throw new MembershipCreateUserException("user doesn't exist.");

            if (String.IsNullOrEmpty(contact.Email))
                throw new MembershipCreateUserException("User must have an email.");

            // account already registered.
            if (!String.IsNullOrEmpty(contact.UserId))
                throw new MembershipCreateUserException("Email already registered.");

            var userManager = Globals.GetUserManager();

            // see if user is registerd.
            var user = await userManager.FindByNameAsync(contact.Email);
            if (user != null)
                throw new MembershipCreateUserException("Email already registered.");

            contact.UserId = await CreateAndEmailAccount(contact.CreatorAccountId, contact.Email);
            if (!String.IsNullOrEmpty(contact.UserId)) 
            {
                db.SubmitChanges();
                return contact.UserId;
            }

            return String.Empty;
        }

        static public async Task<bool> UpdateContact(Contact contact, bool registerIfNeeded)
        {
            bool updateUserId = false;

            DB db = DBConnection.GetContext();
            var dbContact = (from c in db.Contacts
                             where c.Id == contact.Id
                             select c).SingleOrDefault();
            if (dbContact == null)
                return false;

            contact.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone1));
            contact.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone2));
            contact.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone3));

            string origEmail = dbContact.Email;
            string newEmail = contact.Email;

            if (String.Compare(newEmail, origEmail, StringComparison.InvariantCultureIgnoreCase) != 0)
            {
                ApplicationUser user = null;
                var userManager = Globals.GetUserManager();

                // see if user is registerd.
                if (!String.IsNullOrEmpty(origEmail))
                {
                    user = await userManager.FindByNameAsync(origEmail);
                }

                // if user id does not equal contact.UserId something is wrong. The email in the Users
                // table is the same as this contact, but it is a different user id.
                if (user != null && String.Compare(user.Id, dbContact.UserId) != 0)
                    throw new Exception(String.Format("Internal Error: contact id = {0}, userId = {1}, doesn't match users table user id = {2}", contact.Id, contact.UserId, user.Id));

                if (user == null)
                {
                    // not registered. See if new email is specfied and we want to register.
                    if (!String.IsNullOrEmpty(newEmail) && registerIfNeeded)
                    {
                        // need to create the account.
                        contact.UserId = await CreateAndEmailAccount(contact.CreatorAccountId, newEmail);
                        if (!String.IsNullOrEmpty(contact.UserId))
                            updateUserId = true;
                    }
                }
                else
                {
                    // user account exists.
                    if (!String.IsNullOrEmpty(newEmail))
                    {
                        // see if new email is already registered.
                        var newUser = await userManager.FindByNameAsync(newEmail);
                        if (newUser != null)
                        {
                            // something wrong, the email is being used. See if it is used by a contact.
                            Contact c = DataAccess.Contacts.GetContact(newUser.Id);
                            if (c != null)
                            {
                                if (String.Compare(c.Email, newEmail, StringComparison.InvariantCultureIgnoreCase) == 0)
                                {
                                    throw new Exception(String.Format("{1} Email address is already registered to another contact {0}", c.Id, newEmail));
                                }
                                else
                                {
                                    throw new Exception(String.Format("Internal Error: User account (id={0}) associated with email ({1}) is tied to a contact {2} but emails don't match.", newUser.Id, newEmail, c.Id));
                                }
                            }

                            throw new Exception(String.Format("Internal Error: {0} email address already registered in users table but no Contact using it.", newEmail));
                        }

                        // update the user name with new email.
                        user.UserName = newEmail;
                        IdentityResult idRes = userManager.Update(user);
                        if (!idRes.Errors.Any())
                            NotifyUserOfNewEmail(dbContact.CreatorAccountId, origEmail, newEmail);
                        else
                            throw new Exception(idRes.Errors.First());
                    }
                    else
                    {
                        // removed the email, remove the account.
                        IdentityResult idRes = await userManager.DeleteAsync(user);
                        if (!idRes.Errors.Any())
                        {
                            contact.UserId = null;
                            updateUserId = true;
                        }
                        else
                            throw new Exception(idRes.Errors.First());
                    }
                }
            }

            contact.Copy(dbContact, updateUserId);
            db.SubmitChanges();
            return true;
        }

        static public bool UpdateContactInfo(Contact contact)
        {
            DB db = DBConnection.GetContext();
            var dbContact = (from c in db.Contacts
                             where c.Id == contact.Id
                             select c).SingleOrDefault();
            if (dbContact == null)
                return false;

            contact.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone1));
            contact.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone2));
            contact.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone3));

            dbContact.StreetAddress = contact.StreetAddress;
            dbContact.City = contact.City;
            dbContact.State = contact.State;
            dbContact.Zip = contact.Zip;
            dbContact.Phone1 = contact.Phone1;
            dbContact.Phone2 = contact.Phone2;
            dbContact.Phone3 = contact.Phone3;

            db.SubmitChanges();
            return true;
        }

        static public void UpdateUserId(Contact contact)
        {
            DB db = DBConnection.GetContext();
            var dbContact = (from c in db.Contacts
                             where c.Id == contact.Id
                             select c).SingleOrDefault();
            if (dbContact == null)
                return;

            dbContact.Email = contact.Email;
            dbContact.UserId = contact.UserId;
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

                await Storage.Provider.DeleteFile(contact.PhotoURL);
                await Storage.Provider.DeleteFile(contact.LargePhotoURL);
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

        public static async Task<bool> ResetPassword(long accountId, ModelObjects.Contact contact)
        {
            if (!String.IsNullOrEmpty(contact.UserId))
            {
                var userManager = Globals.GetUserManager();
                var user = await userManager.FindByIdAsync(contact.UserId);

                if (user != null)
                {
                    string confirmationToken = await userManager.GeneratePasswordResetTokenAsync(user.Id);
                    RouteValueDictionary parameters = new RouteValueDictionary
                    { 
                        {"controller", "Account" }, 
                        { "action", "ResetPassword" }, 
                        { "accountId", accountId }, 
                        { "token", confirmationToken },

                    };

                    VirtualPathData vpd = RouteTable.Routes.GetVirtualPath(null, "Default", parameters);
                    string absPath = VirtualPathUtility.ToAbsolute(vpd.VirtualPath);
                    var url = new Uri(HttpContext.Current.Request.Url, absPath).AbsoluteUri;

                    NotifyUserPasswordReset(accountId, contact, url.ToString());
                    return true;
                }
            }

            return false;
        }

        static private void NotifyUserPasswordReset(long accountId, ModelObjects.Contact contact, String url)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string senderFullName = String.Empty;
            string accountName = String.Empty;
            string fromEmail = String.Empty;

            var sender = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (sender == null)
            {
                accountName = DataAccess.Accounts.GetAccountName(accountId);
                fromEmail = "webmaster@ezrecsports.com";

                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                try
                {
                    if (userManager.IsInRole(Globals.GetCurrentUserId(), "Administrator"))
                        senderFullName = " Administrator";
                    else
                        return;
                }
                catch(Exception)
                {
                    return;
                }
            }
            else
            {
                senderFullName = sender.FullNameFirst;
                accountName = DataAccess.Accounts.GetAccountName(contact.CreatorAccountId);
                fromEmail = sender.Email;
            }

            string subject = String.Format(AccountPasswordSubject, accountName);

            string body = String.Format(AccountPasswordBody, accountName, currentUser, url, senderFullName);

            Globals.MailMessage(new MailAddress(fromEmail, senderFullName), new MailAddress(contact.Email, contact.FullNameFirst), subject, body);
        }

        static private void NotifyUserOfNewEmail(long accountId, string oldEmail, string newEmail)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string senderFullName = String.Empty;

            var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (contact == null)
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                try
                {
                    if (userManager.IsInRole(Globals.GetCurrentUserId(), "Administrator"))
                        senderFullName = DataAccess.Accounts.GetAccountName(accountId) + " Administrator";
                    else
                        return;
                }
                catch(Exception)
                {
                    return;
                }
            }
            else
            {
                senderFullName = contact.FullNameFirst;
            }

            string accountName = DataAccess.Accounts.GetAccountName(accountId);
            string subject = String.Format(AccountModifiedSubject, accountName);
            string body = String.Format(AccountModifiedBody, accountName, currentUser, newEmail, senderFullName);
            Globals.MailMessage(new MailAddress(currentUser, senderFullName), new MailAddress(oldEmail), subject, body);
        }

        static private async Task<String> CreateAndEmailAccount(long accountId, string email)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return String.Empty;

            string senderFullName;

            var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (contact == null)
                senderFullName = currentUser;
            else
                 senderFullName = contact.FullNameFirst;

            var userManager = Globals.GetUserManager();

            string password = Membership.GeneratePassword(8, 2);

            // new way to create user and sign in.
            var user = new ApplicationUser() { UserName = email };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                var newUser = await userManager.FindByNameAsync(email);
                if (newUser != null)
                {
                    // notify user
                    string accountName = DataAccess.Accounts.GetAccountName(accountId);
                    string subject = String.Format(AccountCreatedSubject, accountName);
                    string body = String.Format(AccountCreatedBody, accountName, currentUser, email, password, senderFullName);
                    Globals.MailMessage(new MailAddress(currentUser, senderFullName), new MailAddress(email), subject, body);

                    return newUser.Id;
                }
            }
            else
            {
                StringBuilder errorString = new StringBuilder();
                // couldn't create user.
                foreach(var error in result.Errors)
                {
                    errorString.Append(error);
                    errorString.Append(Environment.NewLine);
                }

                throw new MembershipCreateUserException(errorString.ToString());
            }

            return String.Empty;
        }
    }
}