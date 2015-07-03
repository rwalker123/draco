using AutoMapper;
using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Models;
using SportsManager.Models.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.OData;
using System.Web.Routing;
using System.Web.Security;

namespace SportsManager.Controllers
{
    public class ContactsODataController : ODataController
    {
        internal const int PageSize = 15;

        private DB m_db;
        public ContactsODataController(DB db)
        {
            m_db = db;
        }

        [AcceptVerbs("GET"), HttpGet]
        [EnableQuery(PageSize = PageSize)]
        public IQueryable<ContactNameViewModel> Get(long accountId)
        {
            long affId = (from a in m_db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affiliationAccounts = (from a in m_db.Accounts
                                       where a.Id == accountId || (affId != 1 && a.AffiliationId == affId)
                                       select a.Id);

            return (from c in m_db.Contacts
                    where affiliationAccounts.Contains(c.CreatorAccountId)
                    select new ContactNameViewModel()
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
    }

    public class ContactsAPIController : ApiController
    {
        private const String nameExistsError = "Name already exists.";
        private const String emailExistsError = "Email already exists.";
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


        private DB m_db;
        public ContactsAPIController(DB db)
        {
            m_db = db;
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("contacts")]
        public HttpResponseMessage GetContactDetails(long accountId, long id)
        {
            var contact = m_db.Contacts.Find(id);
            var vm = Mapper.Map<Contact, ContactViewModel>(contact);
            return Request.CreateResponse<ContactViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DoesContactNameExist")]
        public HttpResponseMessage GetDoesContactNameExist(long accountId, long id, string firstName, string lastName, string middleName)
        {
            long affid = (from a in m_db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affAccounts = (from a in m_db.Accounts
                               where a.Id == accountId || (affid != 1 && a.AffiliationId == affid)
                               select a.Id);

            var doesExist = (from c in m_db.Contacts
                             where String.Compare(firstName, c.FirstName, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                                   String.Compare(lastName, c.LastName, StringComparison.CurrentCultureIgnoreCase) == 0 &&
                                   ((middleName == null && c.MiddleName == null) || String.Compare(middleName, c.MiddleName, StringComparison.CurrentCultureIgnoreCase) == 0) &&
                                   affAccounts.Contains(c.CreatorAccountId)
                             select c).Any();

            return Request.CreateResponse<bool>(HttpStatusCode.OK, doesExist);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("contacts")]
        public async Task<HttpResponseMessage> PostContact(long accountId, ContactViewModel vm)
        {
            vm.CreatorAccountId = accountId;

            if (ModelState.IsValid && vm != null)
            {
                try
                {
                    bool registerAccount = false;
                    var qsRegisterAccount = HttpContext.Current.Request["register"];
                    if (qsRegisterAccount != null && qsRegisterAccount.Equals("1"))
                    {
                        registerAccount = true;
                    }

                    Contact contact = new Contact()
                    {
                        Id = vm.Id,
                        Email = vm.Email,
                        FirstName = vm.FirstName,
                        LastName = vm.LastName,
                        MiddleName = vm.MiddleName,
                        Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone1)),
                        Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone2)),
                        Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone3)),
                        CreatorAccountId = vm.CreatorAccountId,
                        StreetAddress = vm.StreetAddress,
                        City = vm.City,
                        State = vm.State,
                        Zip = vm.Zip,
                        FirstYear = vm.FirstYear,
                        DateOfBirth = vm.DateOfBirth,
                        IsFemale = vm.IsFemale
                    };

                    m_db.Contacts.Add(contact);
                    await m_db.SaveChangesAsync();

                    if (contact.Id == 0)
                        return Request.CreateResponse(HttpStatusCode.InternalServerError);

                    if (!String.IsNullOrEmpty(contact.Email) && registerAccount)
                    {
                        contact.UserId = await CreateAndEmailAccount(contact.CreatorAccountId, contact.Email);
                        if (!String.IsNullOrEmpty(contact.UserId))
                        {
                            await m_db.SaveChangesAsync();
                        }
                    }

                    // Create a 201 response.
                    var response = new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(contact.Id.ToString())
                    };
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Contacts", accountId = accountId, id = contact.Id.ToString() }));
                    return response;
                }
                catch (SqlException ex)
                {
                    // key violation, name exists.
                    if (ex.Number == 2627)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, nameExistsError);
                    }
                    else if (ex.Number == 2601)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, emailExistsError);
                    }

                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("resetpassword")]
        public async Task<HttpResponseMessage> ResetPassword(long accountId, long id)
        {

            Contact c = m_db.Contacts.Find(id);
            if (c != null)
            {
                await ResetPassword(accountId, c);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("register")]
        public async Task<HttpResponseMessage> RegisterAccount(long accountId, long id)
        {
            var contact = m_db.Contacts.Find(id);
            try
            {
                var userId = await RegisterUser(contact);
                if (!String.IsNullOrEmpty(userId))
                    return Request.CreateResponse<string>(HttpStatusCode.OK, userId);
                else
                    return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
            catch(MembershipCreateUserException ex)
            {
                return Request.CreateResponse(HttpStatusCode.Conflict, ex.Message);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("contacts")]
        public async Task<HttpResponseMessage> PutContact(long accountId, ContactViewModel vm)
        {
            if (ModelState.IsValid && vm != null)
            {
                vm.CreatorAccountId = accountId;
                var contact = m_db.Contacts.Find(vm.Id);
                if (contact == null)
                    return new HttpResponseMessage(HttpStatusCode.NotFound);

                try
                {
                    bool updateUserId = false;

                    bool registerIfNeeded = false;
                    string qsRegister = HttpContext.Current.Request["register"];
                    if (qsRegister == "1")
                        registerIfNeeded = true;

                    vm.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone1));
                    vm.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone2));
                    vm.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(contact.Phone3));

                    string origEmail = contact.Email;
                    string newEmail = vm.Email;

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
                        if (user != null && String.Compare(user.Id, contact.UserId) != 0)
                            throw new Exception(String.Format("Internal Error: contact id = {0}, userId = {1}, doesn't match users table user id = {2}", vm.Id, vm.UserId, user.Id));

                        if (user == null)
                        {
                            // not registered. See if new email is specfied and we want to register.
                            if (!String.IsNullOrEmpty(newEmail) && registerIfNeeded)
                            {
                                // need to create the account.
                                vm.UserId = await CreateAndEmailAccount(accountId, newEmail);
                                if (!String.IsNullOrEmpty(vm.UserId))
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
                                    Contact c = m_db.Contacts.Find(newUser.Id);
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
                                    NotifyUserOfNewEmail(contact.CreatorAccountId, origEmail, newEmail);
                                else
                                    throw new Exception(idRes.Errors.First());
                            }
                            else
                            {
                                // removed the email, remove the account.
                                IdentityResult idRes = await userManager.DeleteAsync(user);
                                if (!idRes.Errors.Any())
                                {
                                    vm.UserId = null;
                                    updateUserId = true;
                                }
                                else
                                    throw new Exception(idRes.Errors.First());
                            }
                        }
                    }

                    if (updateUserId)
                        contact.UserId = vm.UserId;

                    contact.LastName = vm.LastName;
                    contact.FirstName = vm.FirstName;
                    contact.MiddleName = vm.MiddleName;
                    contact.Phone1 = vm.Phone1;
                    contact.Phone2 = vm.Phone2;
                    contact.Phone3 = vm.Phone3;
                    contact.StreetAddress = vm.StreetAddress;
                    contact.City = vm.City;
                    contact.State = vm.State;
                    contact.Zip = vm.Zip;
                    contact.FirstYear = vm.FirstYear;
                    contact.DateOfBirth = vm.DateOfBirth;
                    contact.IsFemale = vm.IsFemale;
                    contact.Email = vm.Email;

                    m_db.SaveChanges();

                    // Create a 200 response.
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(contact.Id.ToString())
                    };
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Contacts", accountId = accountId, id = contact.Id }));
                    return response;
                }
                catch (MembershipCreateUserException ex)
                {
                    return Request.CreateResponse(HttpStatusCode.Conflict, ex.Message);
                }
                catch (SqlException ex)
                {
                    // key violation, name exists.
                    if (ex.Number == 2627)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, nameExistsError);
                    }
                    else if (ex.Number == 2601)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, emailExistsError);
                    }

                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("contactinfo")]
        public HttpResponseMessage PutContactInfo(long accountId, ContactViewModel vm)
        {
            if (ModelState.IsValid && vm != null)
            {
                vm.CreatorAccountId = accountId;

                try
                {
                    var contact = m_db.Contacts.Find(vm.Id);
                    if (contact.UserId != Globals.GetCurrentUserId())
                        return Request.CreateResponse(HttpStatusCode.Forbidden);

                    contact.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone1));
                    contact.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone2));
                    contact.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone3));

                    contact.StreetAddress = vm.StreetAddress;
                    contact.City = vm.City;
                    contact.State = vm.State;
                    contact.Zip = vm.Zip;
                    contact.Phone1 = vm.Phone1;
                    contact.Phone2 = vm.Phone2;
                    contact.Phone3 = vm.Phone3;

                    m_db.SaveChanges();

                    // Create a 200 response.
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(contact.Id.ToString())
                    };
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Contacts", accountId = accountId, id = contact.Id }));
                    return response;
                }
                catch (MembershipCreateUserException ex)
                {
                    return Request.CreateResponse(HttpStatusCode.Conflict, ex.Message);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("contacts")]
        public async Task<HttpResponseMessage> DeleteContact(long accountId, long id)
        {
            var contact = m_db.Contacts.Find(id);
            if (contact != null)
            {
                if (!String.IsNullOrEmpty(contact.UserId))
                {
                    var userManager = Globals.GetUserManager();
                    var user = await userManager.FindByIdAsync(contact.UserId);

                    if (user != null)
                    {
                        await userManager.DeleteAsync(user);
                    }
                }

                m_db.Contacts.Remove(contact);
                m_db.SaveChanges();

                await Storage.Provider.DeleteFile(contact.PhotoURL);
                await Storage.Provider.DeleteFile(contact.LargePhotoURL);

                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        private static async Task<bool> ResetPassword(long accountId, ModelObjects.Contact contact)
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
                catch (Exception)
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

            Globals.MailMessage(fromEmail, contact.Email, subject, body);
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
                catch (Exception)
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
            Globals.MailMessage(currentUser, oldEmail, subject, body);
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
                    Globals.MailMessage(currentUser, email, subject, body);

                    return newUser.Id;
                }
            }
            else
            {
                StringBuilder errorString = new StringBuilder();
                // couldn't create user.
                foreach (var error in result.Errors)
                {
                    errorString.Append(error);
                    errorString.Append(Environment.NewLine);
                }

                throw new MembershipCreateUserException(errorString.ToString());
            }

            return String.Empty;
        }

        private async Task<String> RegisterUser(Contact contact)
        {
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
                m_db.SaveChanges();
                return contact.UserId;
            }

            return String.Empty;
        }


    }
}
