using AutoMapper;
using AutoMapper.QueryableExtensions;
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
using System.Net.Mail;
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
                    select c).Project<Contact>().To<ContactNameViewModel>();
        }
    }

    public class ContactsAPIController : DBApiController
    {
        private const String nameExistsError = "Name already exists.";
        private const String emailExistsError = "Email already exists.";
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

        public ContactsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("contacts")]
        public HttpResponseMessage GetContactDetails(long accountId, long id)
        {
            var contact = Db.Contacts.Find(id);
            var vm = Mapper.Map<Contact, ContactViewModel>(contact);
            return Request.CreateResponse<ContactViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DoesContactNameExist")]
        public HttpResponseMessage GetDoesContactNameExist(long accountId, long id, string firstName, string lastName, string middleName)
        {
            long affid = (from a in Db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affAccounts = (from a in Db.Accounts
                               where a.Id == accountId || (affid != 1 && a.AffiliationId == affid)
                               select a.Id);

            var doesExist = (from c in Db.Contacts
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

                    Db.Contacts.Add(contact);
                    await Db.SaveChangesAsync();

                    if (contact.Id == 0)
                        return Request.CreateResponse(HttpStatusCode.InternalServerError);

                    if (!String.IsNullOrEmpty(contact.Email) && registerAccount)
                    {
                        contact.UserId = await this.CreateAndEmailAccount(contact.CreatorAccountId, new MailAddress(contact.Email, contact.FullNameFirst));
                        if (!String.IsNullOrEmpty(contact.UserId))
                        {
                            await Db.SaveChangesAsync();
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

            Contact c = Db.Contacts.Find(id);
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
            var contact = Db.Contacts.Find(id);
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
                var contact = Db.Contacts.Find(vm.Id);
                if (contact == null)
                    return new HttpResponseMessage(HttpStatusCode.NotFound);

                try
                {
                    bool registerIfNeeded = false;
                    string qsRegister = HttpContext.Current.Request["register"];
                    if (qsRegister == "1")
                        registerIfNeeded = true;

                    await this.UpdateContact(accountId, contact, vm, registerIfNeeded);

                    Db.SaveChanges();

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
                    var contact = Db.Contacts.Find(vm.Id);
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

                    Db.SaveChanges();

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
            var contact = Db.Contacts.Find(id);
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

                Db.Contacts.Remove(contact);
                Db.SaveChanges();

                await Storage.Provider.DeleteFile(contact.PhotoURL);
                await Storage.Provider.DeleteFile(contact.LargePhotoURL);

                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        private async Task<bool> ResetPassword(long accountId, ModelObjects.Contact contact)
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

        private void NotifyUserPasswordReset(long accountId, ModelObjects.Contact contact, String url)
        {
            String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string senderFullName = String.Empty;
            string accountName = String.Empty;
            MailAddress fromEmail;

            var sender = this.GetCurrentContact();
            if (sender == null)
            {
                accountName = Db.Accounts.Find(accountId)?.Name;
                fromEmail = new MailAddress("webmaster@ezrecsports.com");

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
                accountName = Db.Accounts.Find(contact.CreatorAccountId)?.Name;
                fromEmail = new MailAddress(sender.Email, senderFullName);
            }

            string subject = String.Format(AccountPasswordSubject, accountName);

            string body = String.Format(AccountPasswordBody, accountName, currentUser, url, senderFullName);

            Globals.MailMessage(fromEmail, new MailAddress(contact.Email, contact.FullNameFirst), subject, body);
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

            contact.UserId = await this.CreateAndEmailAccount(contact.CreatorAccountId, new MailAddress(contact.Email, contact.FullNameFirst));
            if (!String.IsNullOrEmpty(contact.UserId))
            {
                Db.SaveChanges();
                return contact.UserId;
            }

            return String.Empty;
        }


    }
}
