using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers.Attributes;
using SportsManager.Models;
using SportsManager.ViewModels;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    [Authorize]
    public class AccountController : DBController
    {
        public AccountController(DB db)
            : base(db)
        {
            UserManager = Globals.GetUserManager();
        }

    public AccountController(DB db, ApplicationUserManager userManager)
            : base(db)
        {
            UserManager = userManager;
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult UserRoles(long accountId)
        {
            return View(new UserRolesViewModel(this, accountId));
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Domains(long accountId)
        {
            return View(new DomainsViewModel(this, accountId));
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Users(long accountId)
        {
            return View(new UsersViewModel(this, accountId));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("exportaddresslist")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [DeleteTempFile]
        public FileStreamResult ExportAddressList(long accountId)
        {
            var vm = new UserAddressViewModel(this, accountId);
            // order
            // filter
            string order = Request.QueryString.Get("order");
            string filter = Request.QueryString.Get("filter");

            FileStream strm = vm.ExportToExcel(order, filter);

            this.TempData["tempFileName"] = strm.Name;
            var fs = new FileStreamResult(strm, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            fs.FileDownloadName = vm.AccountName + "AddressList.xlsx";
            return fs;
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult EMail(long accountId)
        {
            return View("EMailUsers", new EMailUsersViewModel(this, accountId));
        }


        public ApplicationUserManager UserManager { get; private set; }

        //
        // GET: /Account/Login
        [AllowAnonymous]
        public ActionResult Login(long? accountId, string returnUrl)
        {
            if (accountId.HasValue)
            {
                ViewData["AccountId"] = accountId.Value;
                ViewData["AccountName"] = Db.Accounts.Find(accountId.Value)?.Name;
            }

            ViewBag.ReturnUrl = returnUrl != null ? returnUrl : Request.UrlReferrer != null ? Request.UrlReferrer.ToString() : "";
            return View();
        }

        //
        // POST: /Account/Login
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Login(LoginViewModel model, string returnUrl, long? accountId)
        {
            if (accountId.HasValue)
            {
                ViewData["AccountId"] = accountId.Value;
                ViewData["AccountName"] = Db.Accounts.Find(accountId.Value)?.Name;
            }

            if (ModelState.IsValid)
            {
                var user = await UserManager.FindAsync(model.UserName, model.Password);
                if (user != null)
                {
                    await SignInAsync(user, model.RememberMe);
                    if (String.IsNullOrEmpty(returnUrl))
                        return RedirectToAction("Index", "Home");
                    else
                        return Redirect(returnUrl);
                }
                else
                {
                    ModelState.AddModelError("", "Invalid username or password.");
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/Register
        [AllowAnonymous]
        public ActionResult Register(long? accountId)
        {
            if (accountId.HasValue)
                return View(new RegisterViewModel(this, accountId.Value));
            else
                return RedirectToAction("Index", "Home");
        }

        //
        // POST: /Account/Register
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Register(RegisterViewModel model)
        {
            ModelState["Controller"].Errors.Clear();

            if (ModelState.IsValid)
            {
                // find the contact and compare values.
                var contact = Db.Contacts.Find(model.PlayerId);
                if (contact == null)
                {
                    ModelState.AddModelError("PlayerName", "Could not find player. Please try another name or contact your league administrator.");
                }
                else
                {
                    if (!String.IsNullOrEmpty(contact.UserId))
                    {
                        ModelState.AddModelError("PlayerName", "Player is already registered.");
                    }
                    else if (contact.DateOfBirth != model.BirthDate || contact.FirstYear != model.FirstYear)
                    {
                        ModelState.AddModelError("", "Verification information does not match our records. Please try again or contact your league administrator.");
                    }
                    else
                    {
                        var existingUser = await UserManager.FindByNameAsync(model.Email);
                        if (existingUser != null)
                        {
                            ModelState.AddModelError("Email", "Email is already registered, click here if you forgot your password.");
                        }
                        else
                        {
                            var user = new ApplicationUser() { UserName = model.Email };
                            var result = await UserManager.CreateAsync(user, model.Password);
                            if (result.Succeeded)
                            {
                                contact.UserId = user.Id;
                                contact.Email = model.Email;
                                Db.SaveChanges();
                                await SignInAsync(user, isPersistent: false);
                                return RedirectToAction("Index", "Home");
                            }
                            else
                            {
                                AddErrors(result);
                            }
                        }
                    }
                }
            }

            model.AccountId = model.RegisterAccountId;
            ViewData["AccountId"] = model.AccountId;
            ViewData["AccountName"] = model.AccountName;


            // If we got this far, something failed, redisplay form
            model.InitYearList(model.RegisterAccountId);
            return View(model);
        }

        //
        // POST: /Account/Disassociate
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Disassociate(string loginProvider, string providerKey)
        {
            ManageMessageId? message = null;
            IdentityResult result = await UserManager.RemoveLoginAsync(User.Identity.GetUserId(), new UserLoginInfo(loginProvider, providerKey));
            if (result.Succeeded)
            {
                message = ManageMessageId.RemoveLoginSuccess;
            }
            else
            {
                message = ManageMessageId.Error;
            }
            return RedirectToAction("Manage", new { Message = message });
        }

        //
        // GET: /Account/Manage
        public ActionResult Manage(long? accountId, ManageMessageId? message)
        {

            ViewBag.ShowUserInfo = false;
            ViewBag.EditUserInfo = false;

            if (accountId.HasValue)
            {
                ViewData["AccountId"] = accountId.Value;
                ViewData["AccountName"] = Db.Accounts.Find(accountId.Value)?.Name;

                bool showUserInfo = false;
                bool.TryParse(this.GetAccountSetting(accountId.Value, "ShowContactInfo"), out showUserInfo);
                ViewBag.ShowUserInfo = showUserInfo;

                bool editUserInfo = false;
                bool.TryParse(this.GetAccountSetting(accountId.Value, "EditContactInfo"), out editUserInfo);
                ViewBag.EditUserInfo = editUserInfo; 
            }


            ViewBag.StatusMessage =
                message == ManageMessageId.ChangePasswordSuccess ? "Your password has been changed."
                : message == ManageMessageId.SetPasswordSuccess ? "Your password has been set."
                : message == ManageMessageId.RemoveLoginSuccess ? "The external login was removed."
                : message == ManageMessageId.Error ? "An error has occurred."
                : "";
            ViewBag.HasLocalPassword = HasPassword();
            ViewBag.ReturnUrl = Url.Action("Manage");
            return View(new ViewModels.AccountViewModel(this, accountId.GetValueOrDefault()));
        }

        //
        // POST: /Account/Manage
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Manage(ManageUserViewModel model)
        {
            bool hasPassword = HasPassword();
            ViewBag.HasLocalPassword = hasPassword;
            ViewBag.ReturnUrl = Url.Action("Manage");
            if (hasPassword)
            {
                if (ModelState.IsValid)
                {
                    IdentityResult result = await UserManager.ChangePasswordAsync(User.Identity.GetUserId(), model.OldPassword, model.NewPassword);
                    if (result.Succeeded)
                    {
                        return RedirectToAction("Manage", new { Message = ManageMessageId.ChangePasswordSuccess });
                    }
                    else
                    {
                        AddErrors(result);
                    }
                }
            }
            else
            {
                // User does not have a password so remove any validation errors caused by a missing OldPassword field
                ModelState state = ModelState["OldPassword"];
                if (state != null)
                {
                    state.Errors.Clear();
                }

                if (ModelState.IsValid)
                {
                    IdentityResult result = await UserManager.AddPasswordAsync(User.Identity.GetUserId(), model.NewPassword);
                    if (result.Succeeded)
                    {
                        return RedirectToAction("Manage", new { Message = ManageMessageId.SetPasswordSuccess });
                    }
                    else
                    {
                        AddErrors(result);
                    }
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        [AllowAnonymous]
        [HttpGet]
        public ActionResult ResetPassword(long? accountId, string token)
        {
            if (accountId.HasValue)
            {
                ViewData["AccountId"] = accountId.Value;
                ViewData["AccountName"] = Db.Accounts.Find(accountId.Value)?.Name;
            }
            else if (Request.UrlReferrer != null)
                return Redirect(Request.UrlReferrer.ToString());
            else
                return RedirectToAction("Login");

            return View(new ResetPasswordViewModel(token));
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult> ResetPassword(long accountId, ResetPasswordViewModel vm)
        {
            ViewData["AccountId"] = accountId;
            String accountName = Db.Accounts.Find(accountId)?.Name;
            ViewData["AccountName"] = accountName;

            if (ModelState.IsValid)
            {
                var userManager = Globals.GetUserManager();

                var user = await userManager.FindByNameAsync(vm.UserName);
                if (user != null)
                {
                    if (String.IsNullOrEmpty(vm.Token))
                    {
                        string confirmationToken = await userManager.GeneratePasswordResetTokenAsync(user.Id);
                        var url = Url.Action("ResetPassword", "Account", new { token = confirmationToken }, Request.Url.Scheme);

                        String passwordResetMessage = String.Format("<p>A request has been made to reset your password at {1}.</p><p>If you made this request, <a href='{0}'>click here</a> to reset your password.</p><p>If you did not make this request, please ignore this message.</p>", url, accountName);

                        IdentityMessage im = new IdentityMessage()
                        {
                            Body = passwordResetMessage,
                            Subject = "Password Reset",
                            Destination = vm.UserName
                        };
                        await userManager.EmailService.SendAsync(im);

                        return RedirectToAction("ResetPwStepTwo", new { accountId = accountId} );
                    }
                    else
                    {
                        var identityResult = await userManager.ResetPasswordAsync(user.Id, vm.Token, vm.Password);
                        if (identityResult.Errors.Any())
                        {
                            var errors = identityResult.Errors;
                            foreach(var error in errors)
                            ModelState.AddModelError("UserName", error);
                        }
                        else
                            return RedirectToAction("PasswordReset", new { accountId = accountId });
                    }
                }

                ModelState.AddModelError("UserName", "Email is not registered. Please try a different Email address.");
            }

            return View(vm);
        }

        [AllowAnonymous]
        public ActionResult ResetPwStepTwo(long accountId)
        {
            ViewData["AccountId"] = accountId;
            ViewData["AccountName"] = Db.Accounts.Find(accountId)?.Name;

            return View();
        }

        [AllowAnonymous]
        public ActionResult PasswordReset(long accountId)
        {
            ViewData["AccountId"] = accountId;
            ViewData["AccountName"] = Db.Accounts.Find(accountId)?.Name;

            return View();
        }

        //
        // POST: /Account/ExternalLogin
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLogin(string provider, string returnUrl)
        {
            // Request a redirect to the external login provider
            return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "Account", new { ReturnUrl = returnUrl }));
        }

        //
        // GET: /Account/ExternalLoginCallback
        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
        {
            var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
            if (loginInfo == null)
            {
                return RedirectToAction("Login");
            }

            // Sign in the user with this external login provider if the user already has a login
            var user = await UserManager.FindAsync(loginInfo.Login);
            if (user != null)
            {
                await SignInAsync(user, isPersistent: false);
                return RedirectToLocal(returnUrl);
            }
            else
            {
                // If the user does not have an account, then prompt the user to create an account
                ViewBag.ReturnUrl = returnUrl;
                ViewBag.LoginProvider = loginInfo.Login.LoginProvider;
                return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel { UserName = loginInfo.DefaultUserName });
            }
        }

        //
        // POST: /Account/LinkLogin
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LinkLogin(string provider)
        {
            // Request a redirect to the external login provider to link a login for the current user
            return new ChallengeResult(provider, Url.Action("LinkLoginCallback", "Account"), User.Identity.GetUserId());
        }

        //
        // GET: /Account/LinkLoginCallback
        public async Task<ActionResult> LinkLoginCallback()
        {
            var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync(XsrfKey, User.Identity.GetUserId());
            if (loginInfo == null)
            {
                return RedirectToAction("Manage", new { Message = ManageMessageId.Error });
            }
            var result = await UserManager.AddLoginAsync(User.Identity.GetUserId(), loginInfo.Login);
            if (result.Succeeded)
            {
                return RedirectToAction("Manage");
            }
            return RedirectToAction("Manage", new { Message = ManageMessageId.Error });
        }

        //
        // POST: /Account/ExternalLoginConfirmation
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ExternalLoginConfirmation(ExternalLoginConfirmationViewModel model, string returnUrl)
        {
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Manage");
            }

            if (ModelState.IsValid)
            {
                // Get the information about the user from the external login provider
                var info = await AuthenticationManager.GetExternalLoginInfoAsync();
                if (info == null)
                {
                    return View("ExternalLoginFailure");
                }
                var user = new ApplicationUser() { UserName = model.UserName };
                var result = await UserManager.CreateAsync(user);
                if (result.Succeeded)
                {
                    result = await UserManager.AddLoginAsync(user.Id, info.Login);
                    if (result.Succeeded)
                    {
                        await SignInAsync(user, isPersistent: false);
                        return RedirectToLocal(returnUrl);
                    }
                }
                AddErrors(result);
            }

            ViewBag.ReturnUrl = returnUrl;
            return View(model);
        }

        //
        // POST: /Account/LogOff
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LogOff(long? accountId)
        {
            if (accountId.HasValue)
            {
                ViewData["AccountId"] = accountId.Value;
                ViewData["AccountName"] = Db.Accounts.Find(accountId.Value)?.Name;
            }

            AuthenticationManager.SignOut();
            return Redirect(Request.UrlReferrer.ToString());
            //return RedirectToAction("Index", "Home");
        }

        //
        // GET: /Account/ExternalLoginFailure
        [AllowAnonymous]
        public ActionResult ExternalLoginFailure()
        {
            return View();
        }

        [ChildActionOnly]
        public ActionResult RemoveAccountList()
        {
            var linkedAccounts = UserManager.GetLogins(User.Identity.GetUserId());
            ViewBag.ShowRemoveButton = HasPassword() || linkedAccounts.Count > 1;
            return (ActionResult)PartialView("_RemoveAccountPartial", linkedAccounts);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && UserManager != null)
            {
                UserManager.Dispose();
                UserManager = null;
            }
            base.Dispose(disposing);
        }

        #region Helpers
        // Used for XSRF protection when adding external logins
        private const string XsrfKey = "XsrfId";

        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }

        private async Task SignInAsync(ApplicationUser user, bool isPersistent)
        {
            AuthenticationManager.SignOut(DefaultAuthenticationTypes.ExternalCookie);
            var identity = await UserManager.CreateIdentityAsync(user, DefaultAuthenticationTypes.ApplicationCookie);
            AuthenticationManager.SignIn(new AuthenticationProperties() { IsPersistent = isPersistent }, identity);
        }

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error);
            }
        }

        private bool HasPassword()
        {
            var user = UserManager.FindById(User.Identity.GetUserId());
            if (user != null)
            {
                return user.PasswordHash != null;
            }
            return false;
        }

        public enum ManageMessageId
        {
            ChangePasswordSuccess,
            SetPasswordSuccess,
            RemoveLoginSuccess,
            Error
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

        private class ChallengeResult : HttpUnauthorizedResult
        {
            public ChallengeResult(string provider, string redirectUri) : this(provider, redirectUri, null)
            {
            }

            public ChallengeResult(string provider, string redirectUri, string userId)
            {
                LoginProvider = provider;
                RedirectUri = redirectUri;
                UserId = userId;
            }

            public string LoginProvider { get; set; }
            public string RedirectUri { get; set; }
            public string UserId { get; set; }

            public override void ExecuteResult(ControllerContext context)
            {
                var properties = new AuthenticationProperties() { RedirectUri = RedirectUri };
                if (UserId != null)
                {
                    properties.Dictionary[XsrfKey] = UserId;
                }
                context.HttpContext.GetOwinContext().Authentication.Challenge(properties, LoginProvider);
            }
        }
        #endregion
    }
}