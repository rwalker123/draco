using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Web;
using System.Web.Http;
using SportsManager.Models;
using SportsManager.Models.Utils;

namespace SportsManager.Baseball.Controllers
{
    public class BaseballAPIController : ApiController
    {
        public HttpResponseMessage GetPlayerName(long accountId, long seasonId, long id)
        {
            var name = DataAccess.TeamRoster.GetPlayerName(id, seasonId == 0);
            if (name == null)
                throw new HttpResponseException(HttpStatusCode.NotFound);

            return Request.CreateResponse<ModelObjects.ContactName>(HttpStatusCode.OK, name);
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage SearchPlayerName(long accountId, string term)
        {
            var name = DataAccess.TeamRoster.FindPlayers(accountId, term).Take(20);
            if (name == null)
                throw new HttpResponseException(HttpStatusCode.NotFound);

            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, name);
        }

        public HttpResponseMessage SearchPlayerNameExtended(long accountId, string term)
        {
            var name = DataAccess.TeamRoster.FindPlayers(accountId, term);
            if (name == null)
                throw new HttpResponseException(HttpStatusCode.NotFound);

            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, name);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage EmailContacts(long accountId, EmailUsersData data)
        {
            IEnumerable<ModelObjects.Contact> contactList = null;

            switch (data.ToType)
            {
                case 1: // current season
                    contactList = GetSeasonContactList(accountId);
                    break;
                case 2: // selected league
                    contactList = GetLeaguesContactList(data.To);
                    break;
                case 3: // selected team
                    contactList = GetTeamsContactList(data.To);
                    break;
                case 4: // selected manager
                case 5: // selected user
                    contactList = GetUserContactList(data.To);
                    break;
            }

            IEnumerable<MailAddress> failedSends = null;

            if (contactList.Any())
            {
                var toList = (from c in contactList
                              where !String.IsNullOrEmpty(c.Email)
                              select new MailAddress(c.Email, c.FullNameFirst));
                failedSends = Globals.MailMessage(HttpContext.Current.User.Identity.Name, toList, data);
                SendSummaryMessage(toList.Except(failedSends), failedSends, HttpContext.Current.User.Identity.Name, data.Subject, data.Message);
            }


            if (data.Attachments != null)
            {
                foreach (var a in data.Attachments)
                {
                    string fileName = HttpContext.Current.Server.MapPath(a.fileUri);

                    try
                    {
                        if (File.Exists(fileName))
                            File.Delete(fileName);
                    }
                    catch(Exception)
                    {

                    }
                }
            }

            if (!contactList.Any())
                return Request.CreateResponse(HttpStatusCode.NotFound);

            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        private void SendSummaryMessage(IEnumerable<MailAddress> successList, IEnumerable<MailAddress> failedSends, string sendTo, string subject, string message)
        {
            StringBuilder successMsg = new StringBuilder();
            successMsg.Append("<p style='font-style: italic'>Mail successfully sent to:</p>");
            successMsg.Append("<ul>");
            foreach (MailAddress ma in successList)
            {
                successMsg.Append("<li>" + ma.Address + "</li>");
            }
            successMsg.Append("</ul>");

            successMsg.Append("<br />");
            successMsg.Append("<br />");

            successMsg.Append("<p style='font-style: italic'>Mail not sent to:</p>");
            successMsg.Append("<ul>");
            foreach (MailAddress ma in failedSends)
            {
                successMsg.Append("<li>" + ma.Address + "</li>");
            }
            successMsg.Append("</ul>");

            successMsg.Append("<p style='font-style: italic'>Message Sent</p>");
            successMsg.Append(message);

            Globals.MailMessage(sendTo, sendTo, "Sent Message Summary: " + subject, successMsg.ToString());
        }

        private IEnumerable<ModelObjects.Contact> GetSeasonContactList(long accountId)
        {
            return DataAccess.TeamRoster.GetAllActiveContacts(accountId);
        }

        private IEnumerable<ModelObjects.Contact> GetUserContactList(IEnumerable<long> contactIds)
        {
            return (from cId in contactIds
                    select DataAccess.Contacts.GetContact(cId));
        }

        private IEnumerable<ModelObjects.Contact> GetLeaguesContactList(IEnumerable<long> leagueIds)
        {
            List<ModelObjects.Contact> contactList = new List<ModelObjects.Contact>();

            foreach (var leagueId in leagueIds)
            {
                contactList.AddRange(DataAccess.Leagues.GetLeagueContacts(leagueId));
            }

            return contactList;
        }

        private IEnumerable<ModelObjects.Contact> GetTeamsContactList(IEnumerable<long> teamIds)
        {
            List<ModelObjects.Contact> contactList = new List<ModelObjects.Contact>();

            foreach (var teamId in teamIds)
            {
                contactList.AddRange(DataAccess.Teams.GetTeamContacts(teamId));
            }

            return contactList;
        }
    }
}
