using ModelObjects;
using System;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class CleanupMessageBoardAPIController : DBApiController
    {
        public CleanupMessageBoardAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("clean")]
        public HttpResponseMessage CleanupMessageBoard()
        {
            var accounts = Db.Accounts;

            foreach (var acc in accounts)
            {
                CleanupMessageBoard(acc.Id);
                CleanupPlayerClassified(acc.Id);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        private int CleanupPlayerClassified(long accountId)
        {
            var configDaysToKeep = ConfigurationManager.AppSettings["DaysToKeepPlayerClassified"];
            int daysToKeep = 30;
            int.TryParse(configDaysToKeep, out daysToKeep);

            DateTime minDate = DateTime.Today.Subtract(new TimeSpan(daysToKeep, 0, 0, 0, 0));

            var expiredTeamClassifieds = (from tw in Db.TeamsWantedClassifieds
                                          where tw.AccountId == accountId && tw.DateCreated < minDate
                                          select tw);
            Db.TeamsWantedClassifieds.RemoveRange(expiredTeamClassifieds);


            var expiredPlayersClassifieds = (from pw in Db.PlayersWantedClassifieds
                                             where pw.AccountId == accountId && pw.DateCreated < minDate
                                             select pw);
            Db.PlayersWantedClassifieds.RemoveRange(expiredPlayersClassifieds);

            Db.SaveChanges();

            return 1;
        }

        private int CleanupMessageBoard(long accountId)
        {
            var dbNumDaysToKeep = (from s in Db.AccountSettings
                                   where s.SettingKey == "MessageBoardCleanup" && s.AccountId == accountId
                                   select s.SettingValue).SingleOrDefault();

            int numDaysToKeep = 90;
            if (!String.IsNullOrEmpty(dbNumDaysToKeep))
            {
                Int32.TryParse(dbNumDaysToKeep, out numDaysToKeep);
            }

            var minPostDate = DateTime.Now;
            minPostDate = minPostDate.AddDays(numDaysToKeep * -1);

            //--- Delete all non-team expired messages
            var expiredPosts = (from mc in Db.MessageCategories
                                join mp in Db.MessagePosts on mc.Id equals mp.CategoryId
                                where mc.AccountId == accountId &&
                                mp.EditDate < minPostDate &&
                                mp.Id != 0 &&
                                !mc.IsTeam
                                select mp);
            Db.MessagePosts.RemoveRange(expiredPosts);

            foreach (var ep in expiredPosts)
            {
                this.CleanupEmptyMessageTopics(ep.TopicId);
            }

            //--- Delete all team expired messages
            var teamExpiredPosts = (from mc in Db.MessageCategories
                                    join mp in Db.MessagePosts on mc.Id equals mp.CategoryId
                                    join t in Db.Teams on mc.AccountId equals t.Id
                                    where t.AccountId == accountId &&
                                    mp.EditDate < minPostDate &&
                                    mp.Id != 0 &&
                                    mc.IsTeam
                                    select mp);
            Db.MessagePosts.RemoveRange(teamExpiredPosts);

            foreach (var ep in teamExpiredPosts)
            {
                this.CleanupEmptyMessageTopics(ep.TopicId);
            }

            Db.SaveChanges();

            return 1;
        }

    }
}
