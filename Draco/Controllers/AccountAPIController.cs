using AutoMapper;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using ModelObjects;
using SportsManager.Models;
using SportsManager.Providers;
using SportsManager.Results;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class AccountAPIController : DBApiController
    {
        private const string LocalLoginProvider = "Local";
        private ApplicationUserManager _userManager;

        public AccountAPIController(DB db) : base(db)
        {
        }

        #region Account Methods
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Accounts")]
        public HttpResponseMessage GetAccounts()
        {
            var a = Db.Accounts;
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            return Request.CreateResponse<IQueryable<Account>>(HttpStatusCode.OK, a);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("AccountInfo")]
        public HttpResponseMessage GetAccountInfo(long accountId)
        {
            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            return Request.CreateResponse<Account>(HttpStatusCode.OK, a);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage TwitterId(long accountId, IdData twitterData)
        {
            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            a.TwitterAccountName = twitterData.Id;

            Db.SaveChanges();

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(twitterData.Id ?? String.Empty)
            };
            return response;
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage FacebookFanPage(long accountId, IdData facebookData)
        {
            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            a.FacebookFanPage = facebookData.Id;

            Db.SaveChanges();

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(facebookData.Id ?? String.Empty)
            };
            return response;
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("AccountUrl")]
        public HttpResponseMessage PostAccountUrl(long accountId, AccountUrlViewModel url)
        {
            url.URL = url.URL.ToLower();
            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (a.AccountsURL.Where(au => au.URL.ToLower() == url.URL).Any())
                return Request.CreateResponse(HttpStatusCode.Conflict);

            AccountURL newUrl = new AccountURL()
            {
                Account = a,
                URL = url.URL
            };

            Db.AccountsURL.Add(newUrl);
            Db.SaveChanges();

            var aUrl = new AccountUrlViewModel()
            {
                Id = newUrl.Id,
                AccountId = newUrl.AccountId,
                URL = newUrl.URL
            };
            return Request.CreateResponse<AccountUrlViewModel>(HttpStatusCode.OK, aUrl);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("AccountUrl")]
        public HttpResponseMessage PutAccountUrl(long accountId, AccountUrlViewModel url)
        {
            url.URL = url.URL.ToLower();
             var aUrl = Db.AccountsURL.Find(url);
            if (aUrl == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (aUrl.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var a = Db.Accounts.Find(accountId);
            if (a.AccountsURL.Where(au => au.URL.ToLower() == url.URL).Any())
                return Request.CreateResponse(HttpStatusCode.Conflict);

            aUrl.URL = url.URL;
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("AccountUrl")]        
        public HttpResponseMessage DeleteAccountUrl(long accountId, long id)
        {
            AccountURL a = Db.AccountsURL.Find(id);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (a.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.AccountsURL.Remove(a);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AccountOwner(long accountId, long id)
        {
            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            Contact c = Db.Contacts.Find(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (String.IsNullOrEmpty(c.UserId))
                return Request.CreateResponse(HttpStatusCode.ExpectationFailed);

            a.OwnerUserId = c.UserId;

            Db.SaveChanges();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AccountName(long accountId, AccountViewModel accountData)
        {
            if (String.IsNullOrWhiteSpace(accountData.AccountName))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            Account a = Db.Accounts.Find(accountId);
            if (a == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            a.Name = accountData.AccountName;
            a.FirstYear = accountData.FirstYear;
            if (!a.TwitterAccountName.Equals(accountData.TwitterAccountName))
            {
                a.TwitterOauthSecretKey = String.Empty;
                a.TwitterOauthToken = String.Empty;
            }
            a.TwitterAccountName = accountData.TwitterAccountName ?? string.Empty;
            Db.SaveChanges();

            return Request.CreateResponse<AccountViewModel>(HttpStatusCode.OK, accountData);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage YouTubeUserId(long accountId, IdData youTubeUserId)
        {
            var account = Db.Accounts.Find(accountId);
            if (account != null)
            {
                account.YouTubeUserId = youTubeUserId.Id;
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(youTubeUserId.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage YouTubeUserId(long accountId, long teamSeasonId, IdData youTubeUserId)
        {
            var account = Db.TeamsSeasons.Find(teamSeasonId);
            if (account != null)
            {
                var team = account.Team;
                team.YouTubeUserId = youTubeUserId.Id;
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(youTubeUserId.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage DefaultVideo(long accountId, IdData defaultVideo)
        {
            var account = Db.Accounts.Find(accountId);
            if (account != null)
            {
                account.DefaultVideo = defaultVideo.Id;
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(defaultVideo.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage DefaultVideo(long accountId, long teamSeasonId, IdData defaultVideo)
        {
            var account = Db.TeamsSeasons.Find(teamSeasonId);
            if (account != null)
            {
                var team = account.Team;
                team.DefaultVideo = defaultVideo.Id;
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(defaultVideo.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AutoPlayVideo(long accountId, IdData autoPlay)
        {
            var account = Db.Accounts.Find(accountId);
            if (account != null)
            {
                account.AutoPlayVideo = autoPlay.Id.Equals("1");
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(autoPlay.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AutoPlayVideo(long accountId, long teamSeasonId, IdData autoPlay)
        {
            var account = Db.TeamsSeasons.Find(teamSeasonId);
            if (account != null)
            {
                var team = account.Team;
                team.AutoPlayVideo = autoPlay.Id.Equals("1");
                Db.SaveChanges();
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(autoPlay.Id ?? String.Empty)
                };
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage TwitterScript(long accountId)
        {
            var account = Db.Accounts.Find(accountId);
            if (account == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            string script = account.TwitterWidgetScript;
            return Request.CreateResponse<string>(HttpStatusCode.OK, script ?? String.Empty);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage SaveTwitterScript(long accountId, ScriptData twitterScript)
        {
            var account = Db.Accounts.Find(accountId);
            if (account == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            account.TwitterWidgetScript = (twitterScript == null) ? String.Empty : twitterScript.Script;
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage Settings(long accountId)
        {
            var dbAccSettings = (from a in Db.AccountSettings
                                 where a.AccountId == accountId
                                 select a);

            var vm = Mapper.Map<IEnumerable<AccountSetting>, AccountSettingViewModel[]>(dbAccSettings);

            return Request.CreateResponse<AccountSettingViewModel[]>(HttpStatusCode.OK, vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage Settings(long accountId, KeyValueData data)
        {
            this.SetAccountSetting(accountId, data.Id, data.Value);
            return Request.CreateResponse(HttpStatusCode.NoContent);
        }
        #endregion

        #region OAuth2 Methods
        public ApplicationUserManager UserManager
        {
            get
            {
                return _userManager ?? Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                _userManager = value;
            }
        }

        public ISecureDataFormat<AuthenticationTicket> AccessTokenFormat { get; private set; }

        // GET api/Account/UserInfo
        [HostAuthentication(DefaultAuthenticationTypes.ExternalBearer)]
        [Route("UserInfo")]
        public UserInfoViewModel GetUserInfo()
        {
            ExternalLoginData externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);

            return new UserInfoViewModel
            {
                Email = User.Identity.GetUserName(),
                HasRegistered = externalLogin == null,
                LoginProvider = externalLogin != null ? externalLogin.LoginProvider : null
            };
        }

        // POST api/Account/Logout
        [Route("Logout")]
        public IHttpActionResult Logout()
        {
            Authentication.SignOut(CookieAuthenticationDefaults.AuthenticationType);
            return Ok();
        }

        // GET api/Account/ManageInfo?returnUrl=%2F&generateState=true
        [Route("ManageInfo")]
        public async Task<ManageInfoViewModel> GetManageInfo(string returnUrl, bool generateState = false)
        {
            IdentityUser user = await UserManager.FindByIdAsync(User.Identity.GetUserId());

            if (user == null)
            {
                return null;
            }

            List<UserLoginInfoViewModel> logins = new List<UserLoginInfoViewModel>();

            foreach (IdentityUserLogin linkedAccount in user.Logins)
            {
                logins.Add(new UserLoginInfoViewModel
                {
                    LoginProvider = linkedAccount.LoginProvider,
                    ProviderKey = linkedAccount.ProviderKey
                });
            }

            if (user.PasswordHash != null)
            {
                logins.Add(new UserLoginInfoViewModel
                {
                    LoginProvider = LocalLoginProvider,
                    ProviderKey = user.UserName,
                });
            }

            return new ManageInfoViewModel
            {
                LocalLoginProvider = LocalLoginProvider,
                Email = user.UserName,
                Logins = logins,
                ExternalLoginProviders = GetExternalLogins(returnUrl, generateState)
            };
        }

        // POST api/Account/ChangePassword
        [Route("ChangePassword")]
        public async Task<IHttpActionResult> ChangePassword(ChangePasswordBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            IdentityResult result = await UserManager.ChangePasswordAsync(User.Identity.GetUserId(), model.OldPassword,
                model.NewPassword);

            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            return Ok();
        }

        // POST api/Account/SetPassword
        [Route("SetPassword")]
        public async Task<IHttpActionResult> SetPassword(SetPasswordBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            IdentityResult result = await UserManager.AddPasswordAsync(User.Identity.GetUserId(), model.NewPassword);

            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            return Ok();
        }

        // POST api/Account/AddExternalLogin
        [Route("AddExternalLogin")]
        public async Task<IHttpActionResult> AddExternalLogin(AddExternalLoginBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);

            AuthenticationTicket ticket = AccessTokenFormat.Unprotect(model.ExternalAccessToken);

            if (ticket == null || ticket.Identity == null || (ticket.Properties != null
                && ticket.Properties.ExpiresUtc.HasValue
                && ticket.Properties.ExpiresUtc.Value < DateTimeOffset.UtcNow))
            {
                return BadRequest("External login failure.");
            }

            ExternalLoginData externalData = ExternalLoginData.FromIdentity(ticket.Identity);

            if (externalData == null)
            {
                return BadRequest("The external login is already associated with an account.");
            }

            IdentityResult result = await UserManager.AddLoginAsync(User.Identity.GetUserId(),
                new UserLoginInfo(externalData.LoginProvider, externalData.ProviderKey));

            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            return Ok();
        }

        // POST api/Account/RemoveLogin
        [Route("RemoveLogin")]
        public async Task<IHttpActionResult> RemoveLogin(RemoveLoginBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            IdentityResult result;

            if (model.LoginProvider == LocalLoginProvider)
            {
                result = await UserManager.RemovePasswordAsync(User.Identity.GetUserId());
            }
            else
            {
                result = await UserManager.RemoveLoginAsync(User.Identity.GetUserId(),
                    new UserLoginInfo(model.LoginProvider, model.ProviderKey));
            }

            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            return Ok();
        }

        // GET api/Account/ExternalLogin
        [OverrideAuthentication]
        [HostAuthentication(DefaultAuthenticationTypes.ExternalCookie)]
        [AllowAnonymous]
        [Route("ExternalLogin", Name = "ExternalLogin")]
        public async Task<IHttpActionResult> GetExternalLogin(string provider, string error = null)
        {
            if (error != null)
            {
                return Redirect(Url.Content("~/") + "#error=" + Uri.EscapeDataString(error));
            }

            if (!User.Identity.IsAuthenticated)
            {
                return new ChallengeResult(provider, this);
            }

            ExternalLoginData externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);

            if (externalLogin == null)
            {
                return InternalServerError();
            }

            if (externalLogin.LoginProvider != provider)
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
                return new ChallengeResult(provider, this);
            }

            ApplicationUser user = await UserManager.FindAsync(new UserLoginInfo(externalLogin.LoginProvider,
                externalLogin.ProviderKey));

            bool hasRegistered = user != null;

            if (hasRegistered)
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);

                ClaimsIdentity oAuthIdentity = await user.GenerateUserIdentityAsync(UserManager,
                   OAuthDefaults.AuthenticationType);
                ClaimsIdentity cookieIdentity = await user.GenerateUserIdentityAsync(UserManager,
                    CookieAuthenticationDefaults.AuthenticationType);

                AuthenticationProperties properties = ApplicationOAuthProvider.CreateProperties(user.UserName);
                Authentication.SignIn(properties, oAuthIdentity, cookieIdentity);
            }
            else
            {
                IEnumerable<Claim> claims = externalLogin.GetClaims();
                ClaimsIdentity identity = new ClaimsIdentity(claims, OAuthDefaults.AuthenticationType);
                Authentication.SignIn(identity);
            }

            return Ok();
        }

        // GET api/Account/ExternalLogins?returnUrl=%2F&generateState=true
        [AllowAnonymous]
        [Route("ExternalLogins")]
        public IEnumerable<ExternalLoginViewModel> GetExternalLogins(string returnUrl, bool generateState = false)
        {
            IEnumerable<AuthenticationDescription> descriptions = Authentication.GetExternalAuthenticationTypes();
            List<ExternalLoginViewModel> logins = new List<ExternalLoginViewModel>();

            string state;

            if (generateState)
            {
                const int strengthInBits = 256;
                state = RandomOAuthStateGenerator.Generate(strengthInBits);
            }
            else
            {
                state = null;
            }

            foreach (AuthenticationDescription description in descriptions)
            {
                ExternalLoginViewModel login = new ExternalLoginViewModel
                {
                    Name = description.Caption,
                    Url = Url.Route("ExternalLogin", new
                    {
                        provider = description.AuthenticationType,
                        response_type = "token",
                        client_id = Startup.PublicClientId,
                        redirect_uri = new Uri(Request.RequestUri, returnUrl).AbsoluteUri,
                        state = state
                    }),
                    State = state
                };
                logins.Add(login);
            }

            return logins;
        }

        // POST api/Account/Register
        [AllowAnonymous]
        [Route("Register")]
        public async Task<IHttpActionResult> Register(RegisterBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = new ApplicationUser() { UserName = model.Email, Email = model.Email };

            IdentityResult result = await UserManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            return Ok();
        }

        // POST api/Account/RegisterExternal
        [OverrideAuthentication]
        [HostAuthentication(DefaultAuthenticationTypes.ExternalBearer)]
        [Route("RegisterExternal")]
        public async Task<IHttpActionResult> RegisterExternal(RegisterExternalBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var info = await Authentication.GetExternalLoginInfoAsync();
            if (info == null)
            {
                return InternalServerError();
            }

            var user = new ApplicationUser() { UserName = model.Email, Email = model.Email };

            IdentityResult result = await UserManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            result = await UserManager.AddLoginAsync(user.Id, info.Login);
            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }
            return Ok();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                UserManager.Dispose();
            }

            base.Dispose(disposing);
        }

        #region Helpers

        private IAuthenticationManager Authentication
        {
            get { return Request.GetOwinContext().Authentication; }
        }

        private IHttpActionResult GetErrorResult(IdentityResult result)
        {
            if (result == null)
            {
                return InternalServerError();
            }

            if (!result.Succeeded)
            {
                if (result.Errors != null)
                {
                    foreach (string error in result.Errors)
                    {
                        ModelState.AddModelError("", error);
                    }
                }

                if (ModelState.IsValid)
                {
                    // No ModelState errors are available to send, so just return an empty BadRequest.
                    return BadRequest();
                }

                return BadRequest(ModelState);
            }

            return null;
        }

        private class ExternalLoginData
        {
            public string LoginProvider { get; set; }
            public string ProviderKey { get; set; }
            public string UserName { get; set; }

            public IList<Claim> GetClaims()
            {
                IList<Claim> claims = new List<Claim>();
                claims.Add(new Claim(ClaimTypes.NameIdentifier, ProviderKey, null, LoginProvider));

                if (UserName != null)
                {
                    claims.Add(new Claim(ClaimTypes.Name, UserName, null, LoginProvider));
                }

                return claims;
            }

            public static ExternalLoginData FromIdentity(ClaimsIdentity identity)
            {
                if (identity == null)
                {
                    return null;
                }

                Claim providerKeyClaim = identity.FindFirst(ClaimTypes.NameIdentifier);

                if (providerKeyClaim == null || String.IsNullOrEmpty(providerKeyClaim.Issuer)
                    || String.IsNullOrEmpty(providerKeyClaim.Value))
                {
                    return null;
                }

                if (providerKeyClaim.Issuer == ClaimsIdentity.DefaultIssuer)
                {
                    return null;
                }

                return new ExternalLoginData
                {
                    LoginProvider = providerKeyClaim.Issuer,
                    ProviderKey = providerKeyClaim.Value,
                    UserName = identity.FindFirstValue(ClaimTypes.Name)
                };
            }
        }

        private static class RandomOAuthStateGenerator
        {
            private static RandomNumberGenerator _random = new RNGCryptoServiceProvider();

            public static string Generate(int strengthInBits)
            {
                const int bitsPerByte = 8;

                if (strengthInBits % bitsPerByte != 0)
                {
                    throw new ArgumentException("strengthInBits must be evenly divisible by 8.", "strengthInBits");
                }

                int strengthInBytes = strengthInBits / bitsPerByte;

                byte[] data = new byte[strengthInBytes];
                _random.GetBytes(data);
                return HttpServerUtility.UrlTokenEncode(data);
            }
        }

        #endregion

        #endregion
    }
}
