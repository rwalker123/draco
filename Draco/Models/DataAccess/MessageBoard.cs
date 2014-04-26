using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;


namespace DataAccess
{
    /// <summary>
    /// Summary description for MessageBoard
    /// </summary>
    static public class MessageBoard
    {
        static public IQueryable<MessageCategory> GetCategories(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from mc in db.MessageCategories
                    where mc.AccountId == accountId && !mc.isTeam
                    orderby mc.CategoryOrder, mc.CategoryName
                    select new MessageCategory()
                    {
                        Id = mc.Id,
                        AccountId = mc.AccountId,
                        AllowAnonymousPost = mc.AllowAnonymousPost,
                        AllowAnonymousTopic = mc.AllowAnonymousTopic,
                        Name = mc.CategoryName,
                        IsModerated = mc.isModerated,
                        IsTeam = mc.isTeam,
                        Description = mc.CategoryDescription,
                        Order = mc.CategoryOrder
                    });
        }

        static public IQueryable<MessageCategory> GetContactGlobalCategoriesWithDetails(long accountId, Contact contact)
        {
            bool isAdmin = false;

            if (contact == null)
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                isAdmin = userManager.IsInRole(Globals.GetCurrentUserId(), "Administrator");
            }


            if (isAdmin || DataAccess.Accounts.IsAccountAdmin(accountId, contact.UserId))
            {
                DB db = DBConnection.GetContext();
                return (from mc in db.MessageCategories
                        where mc.AccountId == 0
                        select new MessageCategory()
                        {
                            Id = mc.Id,
                            AccountId = mc.AccountId,
                            AllowAnonymousPost = mc.AllowAnonymousPost,
                            AllowAnonymousTopic = mc.AllowAnonymousTopic,
                            Name = mc.CategoryName,
                            IsModerated = mc.isModerated,
                            IsTeam = mc.isTeam,
                            Description = mc.CategoryDescription,
                            Order = mc.CategoryOrder,
                            LastPost = GetLastPostForCategory(mc.Id),
                            NumberOfThreads = GetNumberOfThreadsForCategory(mc.Id)
                        });
            }

            return null;
        }

        static public IEnumerable<MessageCategory> GetContactTeamCategoriesWithDetails(long accountId, Contact contact)
        {
            DB db = DBConnection.GetContext();

            IQueryable<long> teamIds;

            bool isAdmin = false;

            if (contact == null)
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                isAdmin = userManager.IsInRole(Globals.GetCurrentUserId(), "Administrator");
            }

            if (isAdmin)
            {
                // admin can see all teams.
                teamIds = (from cs in db.CurrentSeasons
                           join ls in db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in db.Leagues on ls.LeagueId equals l.Id
                           join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           where cs.AccountId == accountId
                           select ts.TeamId).Distinct();
            }
            else
            {
                // non-admin can see teams they are on Roster, a manager, or a "TeamAdmin" or "TeamPhotoAdmin"
                teamIds = (from cs in db.CurrentSeasons
                           join ls in db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in db.Leagues on ls.LeagueId equals l.Id
                           join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           join rs in db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                           join r in db.Rosters on rs.PlayerId equals r.Id
                           where cs.AccountId == accountId && r.ContactId == contact.Id && !rs.Inactive
                           select ts.TeamId).Union(
                               (from cs in db.CurrentSeasons
                                join ls in db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                                join l in db.Leagues on ls.LeagueId equals l.Id
                                join ts in db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                join tsm in db.TeamSeasonManagers on ts.Id equals tsm.TeamSeasonId
                                where cs.AccountId == accountId && tsm.ContactId == contact.Id
                                select ts.TeamId)
                               ).Union(
                               (from cr in db.ContactRoles
                                join c in db.Contacts on cr.ContactId equals c.Id
                                join ur in db.AspNetRoles on cr.RoleId equals ur.Id
                                where c.CreatorAccountId == accountId && cr.ContactId == contact.Id &&
                                (ur.Name == "TeamAdmin" || ur.Name == "TeamPhotoAdmin")
                                select cr.RoleData)
                               ).Distinct();
            }

            List<MessageCategory> cats = new List<MessageCategory>();

            if (!teamIds.Any())
                return cats;

            foreach (var teamId in teamIds)
            {
                SportsManager.Model.MessageCategory dbMessageCategory = (from mc in db.MessageCategories
                                                                         where mc.isTeam && mc.AccountId == teamId
                                                                         select mc).SingleOrDefault();

                if (dbMessageCategory == null)
                {
                    dbMessageCategory = new SportsManager.Model.MessageCategory()
                    {
                        AccountId = teamId,
                        CategoryOrder = 0,
                        CategoryName = "{0} Chat",
                        CategoryDescription = "Discussion forum available only to logged in team members",
                        AllowAnonymousPost = false,
                        AllowAnonymousTopic = false,
                        isTeam = true,
                        isModerated = false
                    };

                    db.MessageCategories.InsertOnSubmit(dbMessageCategory);
                    db.SubmitChanges();
                }

                ModelObjects.MessageCategory messageCategory = new MessageCategory()
                {
                    Id = dbMessageCategory.Id,
                    AccountId = dbMessageCategory.AccountId,
                    AllowAnonymousPost = dbMessageCategory.AllowAnonymousPost,
                    AllowAnonymousTopic = dbMessageCategory.AllowAnonymousTopic,
                    Name = String.Format(dbMessageCategory.CategoryName, DataAccess.Teams.GetTeamNameFromTeamId(dbMessageCategory.AccountId, true)),
                    IsModerated = dbMessageCategory.isModerated,
                    IsTeam = dbMessageCategory.isTeam,
                    Description = dbMessageCategory.CategoryDescription,
                    Order = dbMessageCategory.CategoryOrder,
                    LastPost = GetLastPostForCategory(dbMessageCategory.Id),
                    NumberOfThreads = GetNumberOfThreadsForCategory(dbMessageCategory.Id)
                };

                cats.Add(messageCategory);

            }

            return cats;
        }


        static public IQueryable<MessageCategory> GetCategoriesWithDetails(long accountId)
        {
            DB db = DBConnection.GetContext();

            return (from mc in db.MessageCategories
                    where mc.AccountId == accountId && !mc.isTeam
                    select new MessageCategory()
                    {
                        Id = mc.Id,
                        AccountId = mc.AccountId,
                        AllowAnonymousPost = mc.AllowAnonymousPost,
                        AllowAnonymousTopic = mc.AllowAnonymousTopic,
                        Name = mc.CategoryName,
                        IsModerated = mc.isModerated,
                        IsTeam = mc.isTeam,
                        Description = mc.CategoryDescription,
                        Order = mc.CategoryOrder,
                        LastPost = GetLastPostForCategory(mc.Id),
                        NumberOfThreads = GetNumberOfThreadsForCategory(mc.Id)
                    });
        }

        static public MessageCategory GetCategory(long id)
        {
            DB db = DBConnection.GetContext();

            return (from mc in db.MessageCategories
                    where mc.Id == id
                    orderby mc.CategoryOrder
                    select new MessageCategory()
                    {
                        Id = mc.Id,
                        AccountId = mc.AccountId,
                        AllowAnonymousPost = mc.AllowAnonymousPost,
                        AllowAnonymousTopic = mc.AllowAnonymousTopic,
                        Name = mc.isTeam ? String.Format(mc.CategoryName, DataAccess.Teams.GetTeamNameFromTeamId(mc.AccountId, true)) : mc.CategoryName,
                        IsModerated = mc.isModerated,
                        IsTeam = mc.isTeam,
                        Description = mc.CategoryDescription,
                        Order = mc.CategoryOrder,
                        LastPost = GetLastPostForCategory(mc.Id),
                        NumberOfThreads = GetNumberOfThreadsForCategory(mc.Id)

                    }).SingleOrDefault();

        }

        static public bool RemoveCategory(long catId)
        {
            DB db = DBConnection.GetContext();

            var dbCat = (from mc in db.MessageCategories
                         where mc.Id == catId
                         select mc).SingleOrDefault();

            if (dbCat == null)
                return false;

            db.MessageCategories.DeleteOnSubmit(dbCat);
            db.SubmitChanges();

            return true;
        }

        static public bool UpdateCategory(MessageCategory cat)
        {
            if (cat.Name.Length == 0)
                return false;

            DB db = DBConnection.GetContext();

            var dbCat = (from mc in db.MessageCategories
                         where mc.Id == cat.Id
                         select mc).SingleOrDefault();

            if (dbCat == null)
                return false;

            dbCat.CategoryOrder = cat.Order;
            dbCat.CategoryName = cat.Name;
            dbCat.CategoryDescription = cat.Description ?? String.Empty;
            dbCat.AllowAnonymousPost = cat.AllowAnonymousPost;
            dbCat.AllowAnonymousTopic = cat.AllowAnonymousTopic;
            dbCat.isTeam = cat.IsTeam;
            dbCat.isModerated = cat.IsModerated;

            db.SubmitChanges();

            return true;
        }

        static public long AddCategory(MessageCategory cat)
        {
            DB db = DBConnection.GetContext();

            if (cat.AccountId <= 0)
                return 0;

            if (cat.Name.Length == 0)
                return 0;

            var dbCat = new SportsManager.Model.MessageCategory()
            {
                AccountId = cat.AccountId,
                CategoryOrder = cat.Order,
                CategoryName = cat.Name,
                CategoryDescription = cat.Description ?? String.Empty,
                AllowAnonymousPost = cat.AllowAnonymousPost,
                AllowAnonymousTopic = cat.AllowAnonymousTopic,
                isModerated = cat.IsModerated,
                isTeam = cat.IsTeam
            };

            db.MessageCategories.InsertOnSubmit(dbCat);
            db.SubmitChanges();

            cat.Id = dbCat.Id;

            return cat.Id;
        }


        static public long AddTopic(MessageTopic topic)
        {
            if (topic.TopicTitle.Length == 0)
                return 0;

            DB db = DBConnection.GetContext();

            if (topic.CreatorContactId <= 0)
            {
                bool allowAnon = (from mc in db.MessageCategories
                                  where mc.Id == topic.CategoryId
                                  select mc.AllowAnonymousTopic).SingleOrDefault();
                if (!allowAnon)
                    return 0;
            }

            var dbTopic = new SportsManager.Model.MessageTopic()
            {
                CategoryId = topic.CategoryId,
                ContactCreatorId = topic.CreatorContactId,
                TopicCreateDate = topic.CreateDate,
                Topic = topic.TopicTitle,
                StickyTopic = topic.StickyTopic,
                NumberOfViews = 0
            };

            db.MessageTopics.InsertOnSubmit(dbTopic);
            db.SubmitChanges();

            topic.Id = dbTopic.Id;

            return topic.Id;
        }

        static public bool RemoveTopic(long topicId)
        {
            DB db = DBConnection.GetContext();

            var dbTopic = (from mc in db.MessageTopics
                         where mc.Id == topicId
                         select mc).SingleOrDefault();

            if (dbTopic == null)
                return false;

            db.MessageTopics.DeleteOnSubmit(dbTopic);
            db.SubmitChanges();

            return true;
        }

        static public long AddPost(MessagePost post)
        {
            if (post.Subject.Length == 0)
                return 0;

            DB db = DBConnection.GetContext();

            if (post.CreatorContactId <= 0)
            {
                bool allowAnon = (from mc in db.MessageCategories
                                  where mc.Id == post.CategoryId
                                  select mc.AllowAnonymousTopic).SingleOrDefault();
                if (!allowAnon)
                    return 0;
            }

            var dbPost = new SportsManager.Model.MessagePost()
            {
                TopicId = post.TopicId,
                PostOrder = post.Order,
                ContactCreatorId = post.CreatorContactId,
                PostDate = post.CreateDate,
                PostText = post.Text ?? String.Empty,
                EditDate = post.EditDate,
                PostSubject = post.Subject,
                CategoryId = post.CategoryId
            };

            db.MessagePosts.InsertOnSubmit(dbPost);
            db.SubmitChanges();

            post.Id = dbPost.Id;
            post.CreatorName = DataAccess.Contacts.GetContactName(post.CreatorContactId);

            return post.Id;
        }

        static public bool ModifyPost(long accountId, MessagePost post)
        {
            if (post.Subject.Length == 0)
                return false;

            DB db = DBConnection.GetContext();
            var dbPost = (from mp in db.MessagePosts
                          where mp.Id == post.Id
                          select mp).SingleOrDefault();

            if (dbPost == null)
                return false;

            // only the admin or original author can modify the post.
            var userId = Globals.GetCurrentUserId();
            if (!DataAccess.Accounts.IsAccountAdmin(accountId, userId))
            {
                var contactId = DataAccess.Contacts.GetContactId(userId);
                if (dbPost.ContactCreatorId != contactId)
                {
                    return false;
                }
            }

            dbPost.PostText = post.Text;
            dbPost.EditDate = post.EditDate;
            dbPost.PostSubject = post.Subject;

            db.SubmitChanges();

            return true;
        }

        static public IQueryable<MessageTopic> GetTopics(long catId)
        {
            DB db = DBConnection.GetContext();

            return (from mt in db.MessageTopics
                    where mt.CategoryId == catId
                    orderby mt.TopicCreateDate
                    select new MessageTopic()
                    {
                        Id = mt.Id,
                        CategoryId = mt.CategoryId,
                        CreatorContactId = mt.ContactCreatorId,
                        CreateDate = mt.TopicCreateDate,
                        TopicTitle = mt.Topic,
                        StickyTopic = mt.StickyTopic,
                        NumberOfViews = mt.NumberOfViews
                    });
        }

        static public IQueryable<MessageTopic> GetTopicsWithDetails(long catId)
        {
            DB db = DBConnection.GetContext();

            return (from mt in db.MessageTopics
                    where mt.CategoryId == catId
                    select new MessageTopic()
                    {
                        Id = mt.Id,
                        CategoryId = mt.CategoryId,
                        CreatorContactId = mt.ContactCreatorId,
                        CreatorName = DataAccess.Contacts.GetContactName(mt.ContactCreatorId),
                        CreateDate = mt.TopicCreateDate,
                        TopicTitle = mt.Topic,
                        StickyTopic = mt.StickyTopic,
                        NumberOfViews = mt.NumberOfViews,
                        LastPost = GetLastPostForTopic(mt.Id),
                        NumberOfReplies = GetTopicReplies(mt.Id)
                    });
        }

        static public MessageTopic GetTopic(long topicId)
        {
            DB db = DBConnection.GetContext();

            return (from mt in db.MessageTopics
                    where mt.Id == topicId
                    select new MessageTopic()
                    {
                        Id = mt.Id,
                        CategoryId = mt.CategoryId,
                        CreatorContactId = mt.ContactCreatorId,
                        CreateDate = mt.TopicCreateDate,
                        TopicTitle = mt.Topic,
                        StickyTopic = mt.StickyTopic,
                        NumberOfViews = mt.NumberOfViews
                    }).SingleOrDefault();
        }

        static public IQueryable<MessagePost> GetPosts(long topicId)
        {
            DB db = DBConnection.GetContext();

            return (from mp in db.MessagePosts
                    where mp.TopicId == topicId
                    select new MessagePost()
                    {
                        Id = mp.Id,
                        TopicId = mp.TopicId,
                        Order = mp.PostOrder,
                        CreatorContactId = mp.ContactCreatorId,
                        CreatorName = DataAccess.Contacts.GetContactName(mp.ContactCreatorId),
                        CreateDate = mp.PostDate,
                        EditDate = mp.EditDate,
                        Subject = mp.PostSubject,
                        CategoryId = mp.CategoryId,
                        Text = mp.PostText
                    });
        }

        static public MessagePost GetPost(long postId)
        {
            DB db = DBConnection.GetContext();

            return (from mp in db.MessagePosts
                    where mp.Id == postId
                    select new MessagePost()
                    {
                        Id = mp.Id,
                        TopicId = mp.TopicId,
                        Order = mp.PostOrder,
                        CreatorContactId = mp.ContactCreatorId,
                        CreateDate = mp.PostDate,
                        EditDate = mp.EditDate,
                        Subject = mp.PostSubject,
                        CategoryId = mp.CategoryId,
                        Text = mp.PostText
                    }).SingleOrDefault();
        }

        static public MessagePost GetLastPostForCategory(long catId)
        {
            DB db = DBConnection.GetContext();

            var maxDate = (from mp in db.MessagePosts
                           where mp.CategoryId == catId
                           orderby mp.PostDate descending
                           select mp.PostDate).FirstOrDefault();

            if (maxDate == DateTime.MinValue)
                return null;

            return (from mp in db.MessagePosts
                    where mp.CategoryId == catId && mp.PostDate == maxDate
                    select new MessagePost()
                    {
                        Id = mp.Id,
                        TopicId = mp.TopicId,
                        Order = mp.PostOrder,
                        CreatorContactId = mp.ContactCreatorId,
                        CreatorName = DataAccess.Contacts.GetContactName(mp.ContactCreatorId),
                        CreateDate = mp.PostDate,
                        EditDate = mp.EditDate,
                        Subject = mp.PostSubject,
                        CategoryId = mp.CategoryId,
                        Text = mp.PostText
                    }).FirstOrDefault();
        }

        static public MessagePost GetLastPostForTopic(long topicId)
        {
            DB db = DBConnection.GetContext();

            var maxDate = (from mp in db.MessagePosts
                           where mp.TopicId == topicId
                           orderby mp.PostDate descending
                           select mp.PostDate).FirstOrDefault();

            if (maxDate == DateTime.MinValue)
                return null;

            return (from mp in db.MessagePosts
                    where mp.TopicId == topicId && mp.PostDate == maxDate
                    select new MessagePost()
                    {
                        Id = mp.Id,
                        TopicId = mp.TopicId,
                        Order = mp.PostOrder,
                        CreatorContactId = mp.ContactCreatorId,
                        CreatorName = DataAccess.Contacts.GetContactName(mp.ContactCreatorId),
                        CreateDate = mp.PostDate,
                        EditDate = mp.EditDate,
                        Subject = mp.PostSubject,
                        CategoryId = mp.CategoryId,
                        Text = mp.PostText
                    }).FirstOrDefault();
        }

        static public long GetNumberOfThreadsForCategory(long catId)
        {
            DB db = DBConnection.GetContext();

            return (from mp in db.MessageTopics
                    where mp.CategoryId == catId
                    select mp.Id).LongCount();
        }

        static public int GetTopicReplies(long topicId)
        {
            DB db = DBConnection.GetContext();
            return (from mp in db.MessagePosts
                    where mp.TopicId == topicId
                    select mp.Id).Count();
        }

        static private bool RemoveMessagePost(long id)
        {
            bool junk;
            return RemoveMessagePost(-1, id, out junk);
        }

        static public bool RemoveMessagePost(long accountId, long id, out bool topicRemoved)
        {
            DB db = DBConnection.GetContext();

            topicRemoved = false;

            var dbPost = (from mp in db.MessagePosts
                          where mp.Id == id
                          select mp).SingleOrDefault();
            if (dbPost != null)
            {
                if (accountId != -1)
                {
                    // only the admin or original author can modify the post.
                    var userId = Globals.GetCurrentUserId();
                    if (!DataAccess.Accounts.IsAccountAdmin(accountId, userId))
                    {
                        var contactId = DataAccess.Contacts.GetContactId(userId);
                        if (dbPost.ContactCreatorId != contactId)
                        {
                            return false;
                        }
                    }
                }

                db.MessagePosts.DeleteOnSubmit(dbPost);
                db.SubmitChanges();

                bool anyTopics = (from mp in db.MessagePosts
                                  where mp.TopicId == dbPost.TopicId
                                  select mp).Any();
                if (!anyTopics)
                {
                    var dbTopic = (from mt in db.MessageTopics
                                   where mt.Id == dbPost.TopicId
                                   select mt).SingleOrDefault();
                    if (dbTopic != null)
                    {
                        db.MessageTopics.DeleteOnSubmit(dbTopic);
                        db.SubmitChanges();
                        topicRemoved = true;
                    }
                }
            }

            return true;
        }

        public static void CleanupMessageBoard()
        {
            IEnumerable<ModelObjects.Account> accounts = DataAccess.Accounts.GetAccounts();

            foreach (ModelObjects.Account acc in accounts)
            {
                CleanupMessageBoard(acc.Id);
            }
        }

        public static int CleanupMessageBoard(long accountId)
        {
            DB db = DBConnection.GetContext();

            var dbNumDaysToKeep = (from s in db.AccountSettings
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
            var expiredPosts = (from mc in db.MessageCategories
                                join mp in db.MessagePosts on mc.Id equals mp.CategoryId
                                where mc.AccountId == accountId &&
                                mp.EditDate < minPostDate &&
                                mp.Id != 0 &&
                                !mc.isTeam
                                select mp);
            foreach (var ep in expiredPosts)
            {
                RemoveMessagePost(ep.Id);
            }

            //--- Delete all team expired messages
            var teamExpiredPosts = (from mc in db.MessageCategories
                                    join mp in db.MessagePosts on mc.Id equals mp.CategoryId
                                    join t in db.Teams on mc.AccountId equals t.Id
                                    where t.AccountId == accountId &&
                                    mp.EditDate < minPostDate &&
                                    mp.Id != 0 &&
                                    mc.isTeam
                                    select mp);
            foreach (var ep in teamExpiredPosts)
            {
                RemoveMessagePost(ep.Id);
            }

            return 1;
        }

        public static int GetExpirationDays(long accountId)
        {
            string cleanupDays = DataAccess.Accounts.GetAccountSetting(accountId, "MessageBoardCleanup");
            int days = 30;
            Int32.TryParse(cleanupDays, out days);
            if (days <= 0)
                days = 30;

            return days;
        }

        public static void SetExpirationDays(long accountId, int days)
        {
            DataAccess.Accounts.SetAccountSetting(accountId, "MessageBoardCleanup", days.ToString());
        }
    }
}