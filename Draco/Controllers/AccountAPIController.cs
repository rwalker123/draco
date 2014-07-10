using SportsManager.Models;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ModelObjects;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Controllers
{
    public class AccountAPIController : ApiController
    {
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage TwitterId(long accountId, IdData twitterData)
        {
            DataAccess.SocialIntegration.Twitter.SetTwitterAccountName(accountId, twitterData.Id);

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
            DataAccess.SocialIntegration.Facebook.SetFacebookFanPage(accountId, facebookData.Id);

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(facebookData.Id ?? String.Empty)
            };
            return response;
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage AccountUrl(long accountId, UriData url)
        {
            url.Uri = url.Uri.ToLower();
            if (ModelState.IsValid)
            {
                DataAccess.Accounts.AddAccountUrl(accountId, url.Uri);
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(url.Uri ?? String.Empty)
                };
                return response;
            }

            var modelStateErrors = ModelState.Keys.SelectMany(key => ModelState[key].Errors);
            if (modelStateErrors.Any())
                return Request.CreateResponse(HttpStatusCode.BadRequest, modelStateErrors.First().ErrorMessage);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("AccountUrl")]        
        public HttpResponseMessage DeleteAccountUrl(long accountId, UriData url)
        {
            if (ModelState.IsValid)
            {
                DataAccess.Accounts.DeleteAccountUrl(accountId, url.Uri);
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(url.Uri ?? String.Empty)
                };
                return response;
            }

            var modelStateErrors = ModelState.Keys.SelectMany(key => ModelState[key].Errors);
            if (modelStateErrors.Any())
                return Request.CreateResponse(HttpStatusCode.BadRequest, modelStateErrors.First().ErrorMessage);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AccountOwner(long accountId, IdData userId)
        {
            if (userId == null || String.IsNullOrWhiteSpace(userId.Id))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            Account a = DataAccess.Accounts.GetAccount(accountId);
            a.OwnerContactId = Int32.Parse(userId.Id);
            DataAccess.Accounts.ModifyAccount(a);

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(userId.Id ?? String.Empty)
            };
            return response;
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage AccountName(long accountId, Account account)
        {
            if (account == null || String.IsNullOrWhiteSpace(account.AccountName))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            Account a = DataAccess.Accounts.GetAccount(accountId);
            a.AccountName = account.AccountName;
            a.FirstYear = account.FirstYear;
            a.TwitterAccountName = account.TwitterAccountName;
            bool rc = DataAccess.Accounts.ModifyAccount(a);
            if (rc)
            {
                return Request.CreateResponse<Account>(HttpStatusCode.OK, account);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage YouTubeUserId(long accountId, IdData youTubeUserId)
        {
            var account = DataAccess.Accounts.GetAccount(accountId);
            if (account != null)
            {
                account.YouTubeUserId = youTubeUserId.Id;
                if (DataAccess.Accounts.ModifyAccount(account))
                {
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(youTubeUserId.Id ?? String.Empty)
                    };
                    return response;
                }
                else
                {
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage TwitterScript(long accountId)
        {
            string script = DataAccess.SocialIntegration.Twitter.GetTwitterWidgetScript(accountId);
            return Request.CreateResponse<string>(HttpStatusCode.OK, script ?? String.Empty);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage SaveTwitterScript(long accountId, ScriptData twitterScript)
        {
            var account = DataAccess.Accounts.GetAccount(accountId);
            if (account != null)
            {
                if (DataAccess.SocialIntegration.Twitter.SetTwitterWidgetScript(accountId, (twitterScript == null) ? String.Empty : twitterScript.Script))
                    return Request.CreateResponse(HttpStatusCode.NoContent);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage Settings(long accountId)
        {
            var accountSettings = DataAccess.Accounts.GetAccountSettings(accountId);
            return Request.CreateResponse<AccountSettings>(HttpStatusCode.OK, accountSettings);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage Settings(long accountId, KeyValueData data)
        {
            DataAccess.Accounts.SetAccountSetting(accountId, data.Id, data.Value);
            return Request.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
