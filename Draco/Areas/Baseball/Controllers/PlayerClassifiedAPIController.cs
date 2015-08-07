using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerClassifiedAPIController : DBApiController
    {
        public PlayerClassifiedAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("playerswanted")]
        public HttpResponseMessage GetPlayersWanted(long accountId)
        {
            var playersWanted = (from pw in Db.PlayersWantedClassifieds
                                 where pw.AccountId == accountId
                                 orderby pw.DateCreated ascending
                                 select pw);

            var vm = Mapper.Map<IEnumerable<PlayersWantedClassified>, PlayersWantedViewModel[]>(playersWanted); 

            return Request.CreateResponse<PlayersWantedViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("playerswanted")]
        public HttpResponseMessage PostPlayersWanted(long accountId, PlayersWantedViewModel model)
        {
            if (ModelState.IsValid)
            {
                var contact = this.GetCurrentContact();
                if (contact == null)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbPlayerWanted = new PlayersWantedClassified()
                {
                    AccountId = accountId,
                    Contact = contact,
                    DateCreated = DateTime.Now,
                    Description = model.Description,
                    PositionsNeeded = model.PositionsNeeded,
                    TeamEventName = model.TeamEventName
                };

                Db.PlayersWantedClassifieds.Add(dbPlayerWanted);
                Db.SaveChanges();

                var vm = Mapper.Map<PlayersWantedClassified, PlayersWantedViewModel>(dbPlayerWanted);
                return Request.CreateResponse<PlayersWantedViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("playerswanted")]
        public HttpResponseMessage PutPlayersWanted(long accountId, long id, PlayersWantedViewModel model)
        {
            if (ModelState.IsValid)
            {
                model.AccountId = accountId;
                model.Id = id;

                var dbPlayerWanted = Db.PlayersWantedClassifieds.Find(id);
                if (dbPlayerWanted == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbPlayerWanted.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                bool isAdmin = this.IsAccountAdmin(accountId, Globals.GetCurrentUserId());
                if (!isAdmin)
                {
                    var contact = this.GetCurrentContact();
                    if (contact == null || contact.Id != dbPlayerWanted.CreatedByContactId)
                        return Request.CreateResponse(HttpStatusCode.Forbidden);
                }

                dbPlayerWanted.TeamEventName = model.TeamEventName;
                dbPlayerWanted.Description = model.Description;
                dbPlayerWanted.PositionsNeeded = model.PositionsNeeded;

                Db.SaveChanges();

                var vm = Mapper.Map<PlayersWantedClassified, PlayersWantedViewModel>(dbPlayerWanted);
                return Request.CreateResponse<PlayersWantedViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("playerswanted")]
        public HttpResponseMessage DeletePlayersWanted(long accountId, long id)
        {
            var dbPlayerWanted = Db.PlayersWantedClassifieds.Find(id);
            if (dbPlayerWanted == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbPlayerWanted.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            bool isAdmin = this.IsAccountAdmin(accountId, Globals.GetCurrentUserId());
            if (!isAdmin)
            {
                var contact = this.GetCurrentContact();
                if (contact == null || contact.Id != dbPlayerWanted.CreatedByContactId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
            }

            Db.PlayersWantedClassifieds.Remove(dbPlayerWanted);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("teamswanted")]
        public HttpResponseMessage GetTeamsWanted(long accountId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            var accessCode = queryValues["c"];

            Guid accessCodeGuid = Guid.Empty;
            if (!String.IsNullOrEmpty(accessCode))
            {
                Guid.TryParse(accessCode, out accessCodeGuid);
            }

            var teamsWanted = (from tw in Db.TeamsWantedClassifieds
                               where tw.AccountId == accountId
                               orderby tw.DateCreated ascending
                               select tw);

            var vm = Mapper.Map<IEnumerable<TeamsWantedClassified>, TeamWantedViewModel[]>(teamsWanted);
            // hack to get CanEdit set, I really would like to pass the access code to the mapper
            int i = 0;
            foreach (var tw in teamsWanted)
            {
                vm[i++].CanEdit = accessCodeGuid == Guid.Empty ? false : accessCodeGuid == tw.AccessCode;
            }

            return Request.CreateResponse<TeamWantedViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("teamswanted")]
        public HttpResponseMessage PostTeamsWanted(long accountId, TeamWantedViewModel model)
        {
            if (ModelState.IsValid)
            {
                var queryValues = Request.RequestUri.ParseQueryString();
                var refererUrl = queryValues["r"];

                var tw = new TeamsWantedClassified()
                {
                    AccountId = accountId,
                    DateCreated = DateTime.Now,
                    Name = model.Name,
                    EMail = model.EMail,
                    Phone = model.Phone,
                    Experience = model.Experience,
                    PositionsPlayed = model.PositionsPlayed,
                    BirthDate = model.BirthDate,
                    AccessCode = Guid.NewGuid()
                };

                Db.TeamsWantedClassifieds.Add(tw);
                Db.SaveChanges();

                // email user with access code so they can edit the entry.
                EmailTeamRegistration(tw, refererUrl + "?c=" + tw.AccessCode);

                // email list of "teams" looking for players about this new entry.
                EmailTeamsLookingForPlayers(tw);

                var vm = Mapper.Map<TeamsWantedClassified, TeamWantedViewModel>(tw);
                return Request.CreateResponse<TeamWantedViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("teamswanted")]
        public HttpResponseMessage PutTeamsWanted(long accountId, long id, TeamWantedViewModel model)
        {
            if (ModelState.IsValid)
            {
                var tw = Db.TeamsWantedClassifieds.Find(id);
                if (tw == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (tw.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                tw.Name = model.Name;
                tw.EMail = model.EMail;
                tw.Phone = model.Phone;
                tw.Experience = model.Experience;
                tw.PositionsPlayed = model.PositionsPlayed;
                tw.BirthDate = model.BirthDate;

                Db.SaveChanges();


                var vm = Mapper.Map<TeamsWantedClassified, TeamWantedViewModel>(tw);
                return Request.CreateResponse<TeamWantedViewModel>(HttpStatusCode.Created, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("teamswanted")]
        public HttpResponseMessage DeleteTeamsWanted(long accountId, long id)
        {
            string userId = Globals.GetCurrentUserId();
            bool isAdmin = this.IsAccountAdmin(accountId, userId);
            var accessCode = string.Empty;
            if (!isAdmin)
            {
                var queryValues = Request.RequestUri.ParseQueryString();
                accessCode = queryValues["c"];
            }

            var dbObj = Db.TeamsWantedClassifieds.Find(id);
            if (dbObj == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (!String.IsNullOrEmpty(accessCode))
            {
                Guid g;
                Guid.TryParse(accessCode, out g);
                if (dbObj.AccessCode != g)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
            }

            Db.TeamsWantedClassifieds.Remove(dbObj);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        private void EmailTeamRegistration(TeamsWantedClassified tw, String refererUrl)
        {
            String registerTeamSubject = "{0} Player Classifieds Registration";
            String registerTeamBody = @"Hello {0}, <br /> 
                        <p>You are recieving this notice because this email address was used to register on the {1} Player Classifieds Board.</p>
                        <p>The registration can be updated or deleted by clicking on this link: {2}. You can find your post in the <b>Teams Wanted</b> section. 
                            Note that you must use this link to enable editing of your post.</p>
                        <p>Your registration will stay active for {3} days. At which time it will be removed from the classifieds page.</p>
                        Thank you,<br />
                        <br />
                        <br />
                        {1}";

            string senderFullName = String.Empty;
            string accountName = String.Empty;
            string fromEmail = String.Empty;

            var a = Db.Accounts.Find(tw.AccountId);
            var sender = Db.Contacts.Find(a.OwnerId);
            if (sender == null)
                return;

            senderFullName = ContactViewModel.BuildFullNameFirst(sender.FirstName, sender.MiddleName, sender.LastName);
            accountName = a.Name;
            fromEmail = sender.Email;

            string subject = String.Format(registerTeamSubject, accountName);

            string body = String.Format(registerTeamBody, tw.Name, accountName, refererUrl, ConfigurationManager.AppSettings["DaysToKeepPlayerClassified"]);

            Globals.MailMessage(new MailAddress(fromEmail, senderFullName), new MailAddress(tw.EMail, tw.Name), subject, body);
        }

        private void EmailTeamsLookingForPlayers(TeamsWantedClassified tw)
        {
            String registerTeamSubject = "{0} Player Registered";
            String registerTeamBody = @"Hello {7},<br /><br />
                        <p>Because you have indicated you need players on the {0} Player Classified Board, we thought you would be interested 
                        to know that a new person has registered and is interested in finding a team. Here is their information:</p><br />
                        {1} {2} years old<br />
                        Positions Played: {3}<br />
                        <p>Experience: {4}</p>
                        <br />
                        Email: <a href='mailto:{5}'>{5}</a><br />
                        Phone: {6}<br /><br />
                        <p>Feel free to contact {1} if you think they can contribute to your team.</p>
                        Thank you,<br />
                        <br />
                        <br />
                        {0}";

            string senderFullName = String.Empty;
            string accountName = String.Empty;
            string fromEmail = String.Empty;

            var sender = this.GetCurrentContact();
            if (sender == null)
                return;

            senderFullName = ContactViewModel.BuildFullNameFirst(sender.FirstName, sender.MiddleName, sender.LastName);
            accountName = Db.Accounts.Find(tw.AccountId).Name;
            fromEmail = sender.Email;

            string subject = String.Format(registerTeamSubject, accountName);

            string body = String.Format(registerTeamBody, accountName, tw.Name, Globals.CalculateAge(tw.BirthDate), tw.PositionsPlayed, tw.Experience, tw.EMail, tw.Phone, tw.Name);

            var bccList = new List<MailAddress>();
            var teamsLooking = Db.PlayersWantedClassifieds.Where(pw => pw.AccountId == tw.AccountId);
            foreach (var teamLooking in teamsLooking)
            {
                bccList.Add(new MailAddress(teamLooking.Contact.Email, ContactViewModel.BuildFullNameFirst(teamLooking.Contact.FirstName, teamLooking.Contact.MiddleName, teamLooking.Contact.LastName)));
            }

            if (bccList.Any())
                Globals.MailMessage(new MailAddress(fromEmail, senderFullName), bccList, new SportsManager.Models.Utils.EmailUsersData()
                {
                    Subject = subject,
                    Message = body
                });
        }
    }
}
