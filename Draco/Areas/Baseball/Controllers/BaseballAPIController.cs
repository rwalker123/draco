using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.Models.Utils;
using SportsManager.ViewModels.API;
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

namespace SportsManager.Baseball.Controllers
{
    public class BaseballAPIController : DBApiController
    {
        public BaseballAPIController(DB db) : base(db)
        { 
        }

        public HttpResponseMessage GetPlayerName(long accountId, long seasonId, long id)
        {
            ContactNameViewModel vm;

            if (seasonId == 0)
            {
                var p = (from r in Db.Rosters
                         where r.Id == id
                         select r).FirstOrDefault();

                if (p == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                vm = Mapper.Map<Player, ContactNameViewModel>(p);
            }
            else
            {
                var p = (from rs in Db.RosterSeasons
                         where rs.Id == id
                         select rs).FirstOrDefault();

                if (p == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                vm = Mapper.Map<PlayerSeason, ContactNameViewModel>(p);
            }

            return Request.CreateResponse<ContactNameViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage SearchPlayerName(long accountId, string term)
        {
            var p = (from r in Db.Rosters
                     join c in Db.Contacts on r.ContactId equals c.Id
                     where r.AccountId == accountId && c.LastName.Contains(term)
                     orderby c.LastName, c.FirstName, c.MiddleName
                     select r).Take(20);

            if (p == null)
                throw new HttpResponseException(HttpStatusCode.NotFound);

            var vm = Mapper.Map<IEnumerable<Player>, ContactNameViewModel[]>(p);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
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
                              select new MailAddress(c.Email, c.FirstName + " " + c.LastName));

                var fromContact = Db.Contacts.Where(c => c.UserId == Globals.GetCurrentUserId()).SingleOrDefault();
                if (fromContact == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                failedSends = Globals.MailMessage(new MailAddress(HttpContext.Current.User.Identity.Name, fromContact.FullNameFirst), toList, data);
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

            Globals.MailMessage(new MailAddress(sendTo), new MailAddress(sendTo), "Sent Message Summary: " + subject, successMsg.ToString());
        }

        private IEnumerable<Contact> GetSeasonContactList(long accountId)
        {
            long seasonId = this.GetCurrentSeasonId(accountId);

            // get leagues in season
            var leagueSeasonIds = (from ls in Db.LeagueSeasons
                           where ls.SeasonId == seasonId
                           select ls.Id);

            return (from ls in Db.LeagueSeasons
                    join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in Db.Rosters on rs.PlayerId equals r.Id
                    join c in Db.Contacts on r.ContactId equals c.Id
                    orderby c.LastName, c.FirstName, c.MiddleName
                    where !String.IsNullOrEmpty(c.Email) && leagueSeasonIds.Contains(ls.Id) && !rs.Inactive
                    select c);
        }

        private IEnumerable<Contact> GetUserContactList(IEnumerable<long> contactIds)
        {
            return (from c in Db.Contacts
                    where contactIds.Contains(c.Id)
                    select c);
        }

        private IEnumerable<Contact> GetLeaguesContactList(IEnumerable<long> leagueIds)
        {
            return (from ls in Db.LeagueSeasons
                    join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                    join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in Db.Rosters on rs.PlayerId equals r.Id
                    join c in Db.Contacts on r.ContactId equals c.Id
                    orderby c.LastName, c.FirstName, c.MiddleName
                    where (c.Email != "" && c.Email != null) && leagueIds.Contains(ls.Id) && !rs.Inactive
                    select c);
        }

        private IEnumerable<Contact> GetTeamsContactList(IEnumerable<long> teamIds)
        {
            return (from ts in Db.TeamsSeasons
                    join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                    join r in Db.Rosters on rs.PlayerId equals r.Id
                    join c in Db.Contacts on r.ContactId equals c.Id
                    where (c.Email != null && c.Email != "") && teamIds.Contains(ts.Id) && !rs.Inactive
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select c);
        }
    }
}
