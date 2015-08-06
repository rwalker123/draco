using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Security;

namespace SportsManager.Controllers
{
    public static class DBExtensions
    {
        public static bool IsAccountAdmin(this IDb db, long accountId, string userId)
        {
            bool rc = false;

            if (!String.IsNullOrEmpty(userId))
            {
                // check to see if in AspNetUserRoles as Administrator
                try
                {
                    var userManager = Globals.GetUserManager();
                    rc = userManager.IsInRole(userId, "Administrator");
                }
                catch (Exception)
                {
                    rc = false;
                }

                if (!rc)
                {
                    // first check to see if this user is an owner of the account.
                    rc = db.IsAccountOwner(accountId);

                    // if not the owner, see if user was given the account admin role.
                    if (!rc)
                    {
                        var roleId = (from r in db.Db.AspNetRoles
                                      where r.Name == "AccountAdmin"
                                      select r.Id).Single();

                        var contactId = (from c in db.Db.Contacts
                                         where c.UserId == userId
                                         select c.Id).SingleOrDefault();

                        if (contactId == 0)
                            return false;

                        var roles = (from cr in db.Db.ContactRoles
                                     where cr.ContactId == contactId && cr.AccountId == accountId
                                     select cr);
                        if (roles != null)
                            rc = (from r in roles
                                  where r.RoleId == roleId && r.AccountId == accountId
                                  select r).Any();
                    }
                }
            }

            return rc;
        }

        static public bool IsTeamAdmin(this IDb db, long accountId, long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamAdmin = false;

            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                try
                {
                    isTeamAdmin = userManager.IsInRole(aspNetUserId, "Administrator");
                }
                catch (Exception)
                {
                    isTeamAdmin = false;
                }

                if (!isTeamAdmin)
                {
                    var contact = db.GetCurrentContact();
                    if (contact != null)
                    {
                        // first check to see if this user the manager, they get admin rights to the team.
                        var managers = (from tsm in db.Db.TeamSeasonManagers
                                        join ts in db.Db.TeamsSeasons on tsm.TeamSeasonId equals ts.Id
                                        join t in db.Db.Teams on ts.TeamId equals t.Id
                                        join c in db.Db.Contacts on tsm.ContactId equals c.Id
                                        where tsm.TeamSeasonId == teamSeasonId
                                        select tsm);

                        isTeamAdmin = (from m in managers
                                       where m.Id == contact.Id
                                       select m).Any();


                        // if not a manager, see if user was given the team admin role.
                        if (!isTeamAdmin)
                        {
                            var roleId = db.GetTeamAdminId();
                            var roles = db.GetContactRoles(accountId, contact.Id);
                            if (roles != null)
                                isTeamAdmin = (from r in roles
                                               where r.RoleId == roleId && r.AccountId == accountId && r.RoleData == teamSeasonId
                                               select r).Any();
                        }
                    }
                }
            }

            return isTeamAdmin;
        }


        public static bool IsAccountOwner(this IDb db, long accountId)
        {
            Account account = db.Db.Accounts.Find(accountId);
            if (account != null)
            {
                string userId = Globals.GetCurrentUserId();

                var contactId = (from c in db.Db.Contacts
                                 where c.UserId == userId
                                 select c.Id).SingleOrDefault();

                return (account.OwnerId == contactId);
            }

            return false;
        }

        public static bool IsPhotoAdmin(this IDb db, long accountId, String userId)
        {
            return (db.IsContactInRole(accountId, userId, db.GetAdminAccountId()) ||
                    db.IsContactInRole(accountId, userId, db.GetAccountPhotoAdminId()));
        }

        public static bool IsTeamPhotoAdmin(this IDb db, long accountId, long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamAdmin = false;

            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                var contact = db.Db.Contacts.Where(c => c.UserId == aspNetUserId).SingleOrDefault();
                if (contact == null)
                    return false;

                // see if user was given the team photo admin role. Note this only checks for 
                // photo admin, if team admin was desired, that role should have been added
                // in the role list. Team admin/account admin/etc does not imply photo admin.
                var roleId = db.GetTeamPhotoAdminId();
                var roles = db.GetContactRoles(accountId, contact.Id);
                if (roles != null)
                    isTeamAdmin = (from r in roles
                                   where r.RoleId == roleId && r.AccountId == accountId && r.RoleData == teamSeasonId
                                   select r).Any();
            }

            return isTeamAdmin;

        }

        static public bool IsTeamMember(this IDb db, long teamSeasonId, string aspNetUserId = null)
        {
            bool isTeamMember = false;

            if (String.IsNullOrEmpty(aspNetUserId))
            {
                aspNetUserId = Globals.GetCurrentUserId();
            }

            if (!String.IsNullOrEmpty(aspNetUserId))
            {
                var contact = db.Db.Contacts.Where(c => c.UserId == aspNetUserId).SingleOrDefault();
                if (contact == null)
                    return false;
                isTeamMember = db.IsTeamMember(contact.Id, teamSeasonId);

            }

            return isTeamMember;
        }

        public static bool IsTeamMember(this IDb db, long contactId, long teamSeasonId)
        {
            // is on roster?
            var isTeamMember = (from r in db.Db.Rosters
                                join rs in db.Db.RosterSeasons on r.Id equals rs.PlayerId
                                join ts in db.Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                                where r.ContactId == contactId && ts.Id == teamSeasonId
                                select r.ContactId).Any();
            if (!isTeamMember)
            {
                // see if they are a manager.
                isTeamMember = (from tsm in db.Db.TeamSeasonManagers
                                where tsm.TeamSeasonId == teamSeasonId && tsm.ContactId == contactId
                                select tsm.ContactId).Any();
            }

            return isTeamMember;
        }


        public static String GetLeagueAdminId(this IDb db)
        {
            return (from r in db.Db.AspNetRoles
                    where r.Name == "LeagueAdmin"
                    select r.Id).Single();
        }

        public static String GetTeamAdminId(this IDb db)
        {
            return (from r in db.Db.AspNetRoles
                    where r.Name == "TeamAdmin"
                    select r.Id).Single();
        }

        public static bool IsContactInRole(this IDb db, long accountId, String aspNetUserId, String roleId)
        {
            var roles = db.GetContactRoles(accountId, aspNetUserId);
            if (roles == null)
                return false;

            return (from r in roles
                    where r.RoleId == roleId
                    select r).Any();
        }

        public static IQueryable<ContactRole> GetContactRoles(this IDb db, long accountId, String aspNetUserId)
        {
            if (String.IsNullOrEmpty(aspNetUserId))
                return null;

            var contactId = (from c in db.Db.Contacts
                             where c.UserId == aspNetUserId
                             select c.Id).SingleOrDefault();

            if (contactId == 0)
                return null;

            return (from cr in db.Db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        public static IQueryable<ContactRole> GetContactRoles(this IDb db, long accountId, long contactId)
        {
            return (from cr in db.Db.ContactRoles
                    where cr.ContactId == contactId && cr.AccountId == accountId
                    select cr);
        }

        public static String GetAdminAccountId(this IDb db)
        {
            return (from r in db.Db.AspNetRoles
                    where r.Name == "AccountAdmin"
                    select r.Id).Single();
        }

        public static String GetAccountPhotoAdminId(this IDb db)
        {
            return (from r in db.Db.AspNetRoles
                    where r.Name == "AccountPhotoAdmin"
                    select r.Id).Single();
        }

        public static String GetTeamPhotoAdminId(this IDb db)
        {
            return (from r in db.Db.AspNetRoles
                    where r.Name == "TeamPhotoAdmin"
                    select r.Id).Single();
        }


        public static Contact GetCurrentContact(this IDb db)
        {
            String userId = Globals.GetCurrentUserId();
            return db.Db.Contacts.Where(c => c.UserId == userId).SingleOrDefault();
        }

        public static IQueryable<TeamSeason> GetCurrentUserTeams(this IDb db, long accountId)
        {
            var contact = db.GetCurrentContact();

            if (contact == null)
                return null;

            var rosterId =  db.Db.Rosters.Where(r => r.ContactId == contact.Id).Select(r => r.Id).SingleOrDefault();

            if (rosterId == 0)
                return null;

            var seasonId = db.GetCurrentSeasonId(accountId);
            if (seasonId == 0)
                return null;

            return (from rs in db.Db.RosterSeasons
                    join ts in db.Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in db.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where ls.SeasonId == seasonId && rs.PlayerId == rosterId && !rs.Inactive
                    select ts);
        }

        /// <summary>
        /// get all the teams the user is an admin for. Note that this doesn't include Administrator or AccountAdmins
        /// as they are admins for all teams.
        /// </summary>
        /// <param name="accountId"></param>
        /// <param name="userName"></param>
        /// <returns>list of team season id's the user is admin for</returns>
        static public IQueryable<long> GetTeamsAsAdmin(this IDb db, long accountId, string userName)
        {
            long currentSeasonId = db.GetCurrentSeasonId(accountId);

            // get user id from username.
            var contactId = db.Db.Contacts.Where(c => c.Email == userName).Select(c => c.Id).SingleOrDefault();
            // if not contact, can't be a team admin.
            if (contactId != 0)
            {
                // all team season ids in current season.
                var teamsInSeason = (from ts in db.Db.TeamsSeasons
                                     join ls in db.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                     where ls.SeasonId == currentSeasonId
                                     select ts.Id);

                // are there teams to be admin of..
                if (teamsInSeason.Any())
                {
                    // get teams contact is manager of..
                    var mgrList = (from tsm in db.Db.TeamSeasonManagers
                                   where tsm.ContactId == contactId && teamsInSeason.Contains(tsm.TeamSeasonId)
                                   select tsm.TeamSeasonId);

                    // get the list of teams the contact is admin for...
                    string roleId = db.GetTeamAdminId();

                    var teamAdmins = (from cr in db.Db.ContactRoles
                                      where cr.ContactId == contactId && cr.AccountId == accountId && cr.RoleId == roleId &&
                                      teamsInSeason.Contains(cr.RoleData)
                                      select cr.RoleData);

                    return mgrList.Union(teamAdmins);
                }
            }

            return new List<long>().AsQueryable();
        }

        static public IQueryable<Contact> GetContacts(this IDb db, long accountId)
        {
            long affId = (from a in db.Db.Accounts
                          where a.Id == accountId
                          select a.AffiliationId).SingleOrDefault();

            var affiliationAccounts = (from a in db.Db.Accounts
                                       where a.Id == accountId || (affId != 1 && a.AffiliationId == affId)
                                       select a.Id);

            return (from c in db.Db.Contacts
                    where affiliationAccounts.Contains(c.CreatorAccountId)
                    select c);
        }

        public static long GetCurrentSeasonId(this IDb db, long accountId)
        {
            return db.Db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();
        }

        public static Season GetCurrentSeason(this IDb db, long accountId)
        {
            var seasonId = db.GetCurrentSeasonId(accountId);
            return db.Db.Seasons.Find(seasonId);
        }

        public static string GetAccountSetting(this IDb db, long accountId, string key)
        {
            string accSetting = Boolean.FalseString;

            var dbAccSetting = (from a in db.Db.AccountSettings
                                where a.AccountId == accountId && a.SettingKey == key
                                select a).SingleOrDefault();

            if (dbAccSetting != null)
            {
                accSetting = dbAccSetting.SettingValue;
            }

            return accSetting;
        }

        public static void SetAccountSetting(this IDb db, long accountId, string key, string value)
        {
            var setting = (from a in db.Db.AccountSettings
                           where a.AccountId == accountId && a.SettingKey == key
                           select a).SingleOrDefault();
            if (setting != null)
            {
                setting.SettingValue = value;
            }
            else
            {
                AccountSetting s = new AccountSetting();
                s.AccountId = accountId;
                s.SettingKey = key;
                s.SettingValue = value;
                db.Db.AccountSettings.Add(s);
            }

            db.Db.SaveChanges();
        }

        public static IQueryable<Game> GetTeamCompletedGames(this IDb db, long teamSeasonId)
        {
            return (from ls in db.Db.LeagueSchedules
                    where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) &&
                    (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                    orderby ls.GameDate
                    select ls);
        }

        static public IQueryable<Game> GetTeamIncompleteGames(this IDb db, long teamSeasonId)
        {
            return (from ls in db.Db.LeagueSchedules
                    where (ls.HTeamId == teamSeasonId || ls.VTeamId == teamSeasonId) &&
                    ls.GameStatus == 0
                    orderby ls.GameDate
                    select ls);
        }

        public static TeamStandingViewModel GetTeamStanding(this IDb db, long teamSeasonId, IQueryable<Game> completedGames)
        {
            var team = db.Db.TeamsSeasons.Find(teamSeasonId);

            var teamStanding = new TeamStandingViewModel(teamSeasonId, team.DivisionSeasonId, team.Name);

            foreach (Game g in completedGames)
            {
                var isHomeTeam = (g.HTeamId == teamSeasonId);
                teamStanding.AddGameResult(isHomeTeam, null, g.HScore, g.VScore, g.GameStatus);
            }

            return teamStanding;
        }

        public static bool CleanupEmptyMessageTopics(this IDb db, long topicId)
        {
            bool topicRemoved = false;

            bool anyTopics = (from mp in db.Db.MessagePosts
                              where mp.TopicId == topicId
                              select mp).Any();
            if (!anyTopics)
            {
                var dbTopic = (from mt in db.Db.MessageTopics
                               where mt.Id == topicId
                               select mt).SingleOrDefault();
                if (dbTopic != null)
                {
                    db.Db.MessageTopics.Remove(dbTopic);
                    db.Db.SaveChanges();
                    topicRemoved = true;
                }
            }

            return topicRemoved;
        }

        public static bool IsValidAccountName(this IDb db, long accountId, string accountName)
        {
            bool validAccountName = true;

            // remove all spaces from names and then do a case insensitive
            // compare.
            string compareAccount = accountName.ToLower();

            // reserved names
            if (compareAccount == "administrator")
            {
                return false;
            }
            else if (accountName.IndexOfAny(System.IO.Path.GetInvalidFileNameChars()) > -1 ||
                      accountName.IndexOfAny(System.IO.Path.GetInvalidPathChars()) > -1)
            {
                return false;
            }

            compareAccount = compareAccount.Replace(" ", String.Empty);

            var accounts = db.Db.Accounts;
            foreach (Account a in accounts)
            {
                string compareWithAccount = a.Name.ToLower();
                compareWithAccount = compareWithAccount.Replace(" ", String.Empty);

                if (compareAccount == compareWithAccount && a.Id != accountId)
                {
                    validAccountName = false;
                    break;
                }
            }

            return validAccountName;
        }

        public static async Task UpdateContact(this IDb db, long accountId, Contact contact, ContactViewModel vm, bool registerIfNeeded)
        {
            bool updateUserId = false;

            vm.Phone1 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone1));
            vm.Phone2 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone2));
            vm.Phone3 = PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(vm.Phone3));

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
                        vm.UserId = await db.CreateAndEmailAccount(accountId, new MailAddress(newEmail, Contact.BuildFullName(vm.FirstName, vm.MiddleName, vm.LastName)));
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
                            Contact c = db.Db.Contacts.Find(newUser.Id);
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
                            db.NotifyUserOfNewEmail(contact.CreatorAccountId, new MailAddress(origEmail, contact.FullNameFirst), newEmail);
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
        }

        public static async Task<String> CreateAndEmailAccount(this IDb db, long accountId, MailAddress email)
        {
            String AccountCreatedSubject = "{0} Account Created";
            String AccountCreatedBody =
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

        String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return String.Empty;

            string senderFullName;

            var contact = db.GetCurrentContact();
            if (contact == null)
                senderFullName = currentUser;
            else
                senderFullName = contact.FullNameFirst;

            var userManager = Globals.GetUserManager();

            string password = Membership.GeneratePassword(8, 2);

            // new way to create user and sign in.
            var user = new ApplicationUser() { UserName = email.Address };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                var newUser = await userManager.FindByNameAsync(email.Address);
                if (newUser != null)
                {
                    // notify user
                    string accountName = db.Db.Accounts.Find(accountId)?.Name;
                    string subject = String.Format(AccountCreatedSubject, accountName);
                    string body = String.Format(AccountCreatedBody, accountName, currentUser, email.Address, password, senderFullName);
                    Globals.MailMessage(new MailAddress(currentUser, senderFullName), email, subject, body);

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

        private static void NotifyUserOfNewEmail(this IDb db, long accountId, MailAddress oldEmail, string newEmail)
        {
            String AccountModifiedSubject = "{0} Account Modified";
            String AccountModifiedBody =
            @"<h4>{0} Account User Name/Email Change Notice</h4>
              <p>A new email address has been associated with your {0} account by <a href='mailto:{1}'>{3}</a>. Your new email address is: {2}.</p>
              <p>This email address is your new <b>user name</b> when logging into the site.</p>
              <p>If this change was made in error, please reply to this email.</p>
              Thank you,<br />
                <br />
                <br />
                {0}";

        String currentUser = Globals.GetCurrentUserName();
            if (String.IsNullOrEmpty(currentUser))
                return;

            string senderFullName = String.Empty;

            string accountName = db.Db.Accounts.Find(accountId)?.Name;

            var contact = db.GetCurrentContact();
            if (contact == null)
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                try
                {
                    if (userManager.IsInRole(Globals.GetCurrentUserId(), "Administrator"))
                        senderFullName = accountName + " Administrator";
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

            string subject = String.Format(AccountModifiedSubject, accountName);
            string body = String.Format(AccountModifiedBody, accountName, currentUser, newEmail, senderFullName);
            Globals.MailMessage(new MailAddress(currentUser, senderFullName), oldEmail, subject, body);
        }
    }
}