using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Mail;

namespace DataAccess
{
    public static class PlayerClassifieds
    {
        public static IQueryable<TeamsWantedClassified> GetTeamsWanted(long accountId, String accessCode)
        {
            DB db = DBConnection.GetContext();

            Guid accessCodeGuid = Guid.Empty;
            if (!String.IsNullOrEmpty(accessCode))
            {
                Guid.TryParse(accessCode, out accessCodeGuid);
            }

            return (from tw in db.TeamsWantedClassifieds
                    where tw.AccountId == accountId
                    orderby tw.DateCreated ascending
                    select new TeamsWantedClassified()
                    {
                        Id = tw.Id,
                        AccountId = tw.AccountId,
                        DateCreated = tw.DateCreated,
                        Name = tw.Name,
                        EMail = tw.EMail,
                        Phone = tw.Phone,
                        Experience = tw.Experience,
                        PositionsPlayed = tw.PositionsPlayed,
                        BirthDate = tw.BirthDate,
                        CanEdit = accessCodeGuid == Guid.Empty ? false : accessCodeGuid == tw.AccessCode 
                    });
        }

        public static bool AddTeamsWanted(TeamsWantedClassified model, string refererUrl)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.TeamsWantedClassified tw = new SportsManager.Model.TeamsWantedClassified();
            tw.Id = model.Id;
            tw.AccountId = model.AccountId;
            tw.DateCreated = model.DateCreated;
            tw.Name = model.Name;
            tw.EMail = model.EMail;
            tw.Phone = model.Phone;
            tw.Experience = model.Experience ?? string.Empty;
            tw.PositionsPlayed = model.PositionsPlayed ?? string.Empty;
            tw.BirthDate = model.BirthDate;
            tw.AccessCode = Guid.NewGuid();

            db.TeamsWantedClassifieds.InsertOnSubmit(tw);
            db.SubmitChanges();

            model.Id = tw.Id;

            // email user with access code so they can edit the entry.
            EmailTeamRegistration(tw, refererUrl + "?c=" + tw.AccessCode);

            // email list of "teams" looking for players about this new entry.
            EmailTeamsLookingForPlayers(tw);
            return true;
        }

        public static bool UpdateTeamsWanted(TeamsWantedClassified model)
        {
            DB db = DBConnection.GetContext();

            SportsManager.Model.TeamsWantedClassified tw = (from t in db.TeamsWantedClassifieds
                                                            where t.Id == model.Id
                                                            select t).SingleOrDefault();
            if (tw == null)
                return false;

            tw.Name = model.Name;
            tw.EMail = model.EMail;
            tw.Phone = model.Phone;
            tw.Experience = model.Experience ?? string.Empty;
            tw.PositionsPlayed = model.PositionsPlayed ?? string.Empty;
            tw.BirthDate = model.BirthDate;

            db.SubmitChanges();

            return true;
        }

        public static bool DeleteTeamsWanted(long id, string accessCode)
        {
            DB db = DBConnection.GetContext();

            var dbObj = (from tw in db.TeamsWantedClassifieds
                         where tw.Id == id
                         select tw).SingleOrDefault();
            if (dbObj != null)
            {
                if (!String.IsNullOrEmpty(accessCode))
                {
                    Guid g;
                    Guid.TryParse(accessCode, out g);
                    if (dbObj.AccessCode != g)
                        return false;
                }
                db.TeamsWantedClassifieds.DeleteOnSubmit(dbObj);
                db.SubmitChanges();
                return true;
            }

            return false;
        }

        public static IQueryable<PlayersWantedClassified> GetPlayersWanted(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from pw in db.PlayersWantedClassifieds
                    where pw.AccountId == accountId
                    orderby pw.DateCreated ascending
                    select new PlayersWantedClassified()
                    {
                        Id = pw.Id,
                        AccountId = pw.AccountId,
                        DateCreated = pw.DateCreated,
                        CreatedByContactId = pw.CreatedByContactId,
                        TeamEventName = pw.TeamEventName,
                        Description = pw.Description,
                        PositionsNeeded = pw.PositionsNeeded,
                        EMail = pw.Contact.Email,
                        Phone = pw.Contact.Phone1,
                        CreatedByName = Contact.BuildFullName(pw.Contact.FirstName, pw.Contact.MiddleName, pw.Contact.LastName),
                        CreatedByPhotoUrl = Contact.GetPhotoURL(pw.Contact.Id)
                    });
        }

        public static bool AddPlayersWanted(PlayersWantedClassified model)
        {
            DB db = DBConnection.GetContext();

            var pw = new SportsManager.Model.PlayersWantedClassified();
            pw.Id = model.Id;
            pw.AccountId = model.AccountId;
            pw.DateCreated = model.DateCreated;
            pw.CreatedByContactId = model.CreatedByContactId;
            pw.TeamEventName = model.TeamEventName;
            pw.Description = model.Description ?? string.Empty;
            pw.PositionsNeeded = model.PositionsNeeded ?? string.Empty;

            db.PlayersWantedClassifieds.InsertOnSubmit(pw);
            db.SubmitChanges();

            model.Id = pw.Id;

            // email list of "players" looking for players about this new entry.
            EmailLookingPlayers(pw);

            return true;
        }

        public static bool UpdatePlayersWanted(PlayersWantedClassified model)
        {
            DB db = DBConnection.GetContext();

            var pw = (from p in db.PlayersWantedClassifieds
                      where p.Id == model.Id
                      select p).SingleOrDefault();

            if (pw == null)
                return false;

            pw.TeamEventName = model.TeamEventName;
            pw.Description = model.Description ?? string.Empty;
            pw.PositionsNeeded = model.PositionsNeeded ?? string.Empty;

            db.SubmitChanges();

            return true;
        }

        public static bool DeletePlayersWanted(long accountId, long id)
        {
            DB db = DBConnection.GetContext();

            var dbObj = (from pw in db.PlayersWantedClassifieds
                         where pw.Id == id
                         select pw).SingleOrDefault();
            if (dbObj != null)
            {
                string userId = Globals.GetCurrentUserId();
                bool isAdmin = DataAccess.Accounts.IsAccountAdmin(accountId, userId);
                if (!isAdmin)
                {
                    var contactId = DataAccess.Contacts.GetContactId(userId);
                    if (dbObj.CreatedByContactId != contactId)
                        return false;
                }

                db.PlayersWantedClassifieds.DeleteOnSubmit(dbObj);
                db.SubmitChanges();
                return true;
            }

            return false;
        }

        private static void EmailLookingPlayers(SportsManager.Model.PlayersWantedClassified pw)
        {
            String registerTeamSubject = "{0} Team Looking for Players";
            String registerTeamBody = @"Hello,<br /><br />
                        <p>Because you have indicated you wish to play in the {0}, we thought you would be interested 
                        to know that a team is looking for players. Here is the information:</p><br />
                        {2}<br />
                        Positions Needed: {3}<br />
                        <p>Description: {4}</p>
                        <br />
                        Contact: {1}<br />
                        Email: <a href='mailto:{5}'>{5}</a><br />
                        Phone: {6}<br /><br />
                        <p>Feel free to contact {1} if you think you can contribute to the team.</p>
                        Thank you,<br />
                        <br />
                        <br />
                        {0}";

            string senderFullName = String.Empty;
            string accountName = String.Empty;
            string fromEmail = String.Empty;

            var sender = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (sender == null)
                return;

            senderFullName = sender.FullNameFirst;
            accountName = DataAccess.Accounts.GetAccountName(pw.AccountId);
            fromEmail = sender.Email;

            string subject = String.Format(registerTeamSubject, accountName);

            string body = String.Format(registerTeamBody, accountName, Contact.BuildFullNameFirst(pw.Contact.FirstName, pw.Contact.MiddleName, pw.Contact.LastName),
                pw.TeamEventName, pw.PositionsNeeded, pw.Description, pw.Contact.Email, pw.Contact.Phone1);

            var bccList = new List<MailAddress>();
            var playersLooking = DataAccess.PlayerClassifieds.GetTeamsWanted(pw.AccountId, String.Empty);
            foreach (var playerLooking in playersLooking)
            {
                bccList.Add(new MailAddress(playerLooking.EMail));
            }

            if (bccList.Any())
                Globals.MailMessage(fromEmail, bccList, new SportsManager.Models.Utils.EmailUsersData()
                    {
                        Subject = subject,
                        Message = body
                    });
        }

        private static void EmailTeamRegistration(SportsManager.Model.TeamsWantedClassified tw, String refererUrl)
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

            var a = DataAccess.Accounts.GetAccount(tw.AccountId);
            var sender = DataAccess.Contacts.GetContact(a.OwnerContactId);
            if (sender == null)
                return;

            senderFullName = sender.FullNameFirst;
            accountName = DataAccess.Accounts.GetAccountName(tw.AccountId);
            fromEmail = sender.Email;

            string subject = String.Format(registerTeamSubject, accountName);

            string body = String.Format(registerTeamBody, tw.Name, accountName, refererUrl, ConfigurationManager.AppSettings["DaysToKeepPlayerClassified"]);

            Globals.MailMessage(fromEmail, tw.EMail, subject, body);
        }

        private static void EmailTeamsLookingForPlayers(SportsManager.Model.TeamsWantedClassified tw)
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

            var sender = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (sender == null)
                return;

            senderFullName = sender.FullNameFirst;
            accountName = DataAccess.Accounts.GetAccountName(tw.AccountId);
            fromEmail = sender.Email;

            string subject = String.Format(registerTeamSubject, accountName);

            string body = String.Format(registerTeamBody, accountName, tw.Name, Globals.CalculateAge(tw.BirthDate), tw.PositionsPlayed, tw.Experience, tw.EMail, tw.Phone, tw.Name);

            var bccList = new List<MailAddress>();
            var teamsLooking = DataAccess.PlayerClassifieds.GetPlayersWanted(tw.AccountId);
            foreach (var teamLooking in teamsLooking)
            {
                bccList.Add(new MailAddress(teamLooking.EMail));
            }

            if (bccList.Any())
                Globals.MailMessage(fromEmail, bccList, new SportsManager.Models.Utils.EmailUsersData()
                    {
                        Subject = subject,
                        Message = body
                    });
        }
    }
}