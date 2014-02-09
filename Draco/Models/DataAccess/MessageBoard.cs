using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using System.Configuration;
using System.Web.SessionState;
using System.IO;
using System.Collections.Generic;
using System.Web.Profile;

using ModelObjects;


namespace DataAccess
{
    /// <summary>
    /// Summary description for MessageBoard
    /// </summary>
    static public class MessageBoard
    {
        static private MessageCategory CreateCategory(SqlDataReader dr)
        {
            return new MessageCategory(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt32(2), dr.GetString(3), dr.GetString(4),
                                       dr.GetBoolean(5), dr.GetBoolean(6), dr.GetBoolean(7), dr.GetBoolean(8));
        }

        static private MessageTopic CreateTopic(SqlDataReader dr)
        {
            return new MessageTopic(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt64(2), dr.GetDateTime(3), dr.GetString(4),
                                       dr.GetBoolean(5), dr.GetInt64(6));
        }

        static private MessagePost CreatePost(SqlDataReader dr)
        {
            return new MessagePost(dr.GetInt64(0), dr.GetInt64(1), dr.GetInt32(2), dr.GetInt64(3), dr.GetDateTime(4),
                                       dr.GetString(5), dr.GetDateTime(6), dr.GetString(7), dr.GetInt64(8));
        }

        static public List<MessageCategory> GetCategories(long accountId)
        {
            List<MessageCategory> cats = new List<MessageCategory>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageCategories", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        cats.Add(CreateCategory(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return cats;
        }

        static public List<MessageCategory> GetContactGlobalCategoriesWithDetails(long accountId, Contact contact)
        {
            List<MessageCategory> cats = new List<MessageCategory>();

            long contactId = contact.Id;

            if (string.Compare(contact.UserName, "administrator", true) == 0 || DataAccess.Accounts.IsAccountAdmin(accountId, contact.UserId))
            {
                try
                {
                    using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                    {
                        SqlCommand myCommand = new SqlCommand("dbo.GetGlobalMessageCategory", myConnection);
                        myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                        myConnection.Open();
                        myCommand.Prepare();

                        SqlDataReader dr = myCommand.ExecuteReader();

                        while (dr.Read())
                        {
                            MessageCategory cat = CreateCategory(dr);
                            cat.LastPost = GetLastPostForCategory(cat.Id);
                            cat.NumberOfThreads = GetNumberOfThreadsForCategory(cat.Id);

                            cats.Add(cat);
                        }
                    }
                }
                catch (SqlException ex)
                {
                    Globals.LogException(ex);
                }

            }

            return cats;
        }

        static public List<MessageCategory> GetContactTeamCategoriesWithDetails(long accountId, Contact contact)
        {
            System.Diagnostics.Debug.Assert(false, "NOT IMPLEMENTED");
            List<MessageCategory> cats = new List<MessageCategory>();

            long contactId = contact.Id;

            if (string.Compare(contact.UserName, "administrator", true) == 0) // || DataAccess.Accounts.IsAccountAdmin(contact.UserId))
            {
                contactId = -1;
            }

            if (contactId == 0)
                return cats;

//CREATE PROCEDURE [dbo].[GetContactTeams]( @accountId bigint, @contactId bigint)
//AS

//    IF @contactId = -1
//    BEGIN
//        SELECT Distinct TeamsSeason.TeamId
//        FROM CurrentSeason LEFT JOIN LeagueSeason ON CurrentSeason.SeasonId = LeagueSeason.SeasonId
//                       LEFT JOIN League ON LeagueSeason.LeagueId = League.Id
//                       LEFT JOIN TeamsSeason ON LeagueSeason.Id = TeamsSeason.LeagueSeasonId
//        WHERE CurrentSeason.AccountId = @accountId 
//    END
//    ELSE
//    BEGIN	
//        SELECT Distinct TeamsSeason.TeamId
//        FROM CurrentSeason LEFT JOIN LeagueSeason ON CurrentSeason.SeasonId = LeagueSeason.SeasonId
//                           LEFT JOIN League ON LeagueSeason.LeagueId = League.Id
//                           LEFT JOIN TeamsSeason ON LeagueSeason.Id = TeamsSeason.LeagueSeasonId
//                           LEFT JOIN RosterSeason ON TeamsSeason.Id = RosterSeason.TeamSeasonId
//                           LEFT JOIN Roster ON RosterSeason.PlayerId = Roster.Id
//        WHERE CurrentSeason.AccountId = @accountId 
//                AND Roster.ContactId = @contactId 
//                AND RosterSeason.Inactive = 0

//        UNION 
//        SELECT Distinct TeamsSeason.TeamId
//        FROM CurrentSeason LEFT JOIN LeagueSeason ON CurrentSeason.SeasonId = LeagueSeason.SeasonId
//                           LEFT JOIN League ON LeagueSeason.LeagueId = League.Id
//                           LEFT JOIN TeamsSeason ON LeagueSeason.Id = TeamsSeason.LeagueSeasonId
//                           LEFT JOIN TeamSeasonManager ON TeamsSeason.Id = TeamSeasonManager.TeamSeasonId
//        WHERE CurrentSeason.AccountId = @accountId
//              AND TeamSeasonManager.ContactId = @contactId
			  
//        UNION
//        SELECT Distinct RoleData 
//        FROM ContactRoles LEFT JOIN Contacts ON ContactRoles.ContactId = Contacts.Id
//        WHERE CreatorAccountId = @accountId AND ContactId = @contactId AND (RoleName = 'TeamAdmin' OR RoleName = 'TeamPhotoAdmin')
		
//    END
            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetContactTeams", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = contactId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    SqlCommand myCommand2 = new SqlCommand("dbo.[GetContactTeamMessageCategory]", myConnection);
                    myCommand2.CommandType = System.Data.CommandType.StoredProcedure;
                    SqlParameter teamParam = myCommand2.Parameters.Add("@teamId", SqlDbType.BigInt);

                    List<long> teamData = new List<long>();

                    while (dr.Read())
                    {
                        if (!teamData.Contains(dr.GetInt64(0)))
                            teamData.Add(dr.GetInt64(0));
                    }

                    dr.Close();

                    foreach (long teamId in teamData)
                    {
                        teamParam.Value = teamId;

                        myCommand2.Prepare();
                        SqlDataReader dr2 = myCommand2.ExecuteReader();

                        if (dr2.Read())
                        {
                            MessageCategory cat = CreateCategory(dr2);
                            cat.Name = String.Format(cat.Name, DataAccess.Teams.GetTeamNameFromTeamId(cat.AccountId, true));
                            
                            cat.LastPost = GetLastPostForCategory(cat.Id);
                            cat.NumberOfThreads = GetNumberOfThreadsForCategory(cat.Id);

                            cats.Add(cat);
                        }

                        dr2.Close();
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return cats;
        }


        static public List<MessageCategory> GetCategoriesWithDetails(long accountId)
        {
            List<MessageCategory> cats = new List<MessageCategory>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageCategories", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        MessageCategory cat = CreateCategory(dr);

                        cat.LastPost = GetLastPostForCategory(cat.Id);
                        cat.NumberOfThreads = GetNumberOfThreadsForCategory(cat.Id);

                        cats.Add(cat);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return cats;
        }

        static public MessageCategory GetCategory(long id)
        {
            MessageCategory cat = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    if (dr.Read())
                    {
                        cat = CreateCategory(dr);
                        if (cat.IsTeam)
                        {
                            cat.Name = String.Format(cat.Name, DataAccess.Teams.GetTeamNameFromTeamId(cat.AccountId, true));
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return cat;
        }

        static public bool RemoveCategory(MessageCategory cat)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteMessageCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = cat.Id;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }

        static public bool UpdateCategory(MessageCategory cat)
        {
            int rowCount = 0;

            if (cat.Name.Length == 0)
                return false;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.UpdateMessageCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = cat.Id;
                    myCommand.Parameters.Add("@order", SqlDbType.Int).Value = cat.Order;
                    myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = cat.Name;
                    myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = cat.Description;
                    myCommand.Parameters.Add("@anonPost", SqlDbType.Bit).Value = cat.AllowAnonymousPost;
                    myCommand.Parameters.Add("@anonTopic", SqlDbType.Bit).Value = cat.AllowAnonymousTopic;
                    myCommand.Parameters.Add("@moderated", SqlDbType.Bit).Value = cat.IsModerated;
                    myCommand.Parameters.Add("@isTeam", SqlDbType.Bit).Value = cat.IsTeam;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }

        static public bool AddCategory(MessageCategory cat)
        {
            int rowCount = 0;

            if (cat.AccountId <= 0)
                return false;

            if (cat.Name.Length == 0)
                return false;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateMessageCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = cat.AccountId;
                    myCommand.Parameters.Add("@order", SqlDbType.Int).Value = cat.Order;
                    myCommand.Parameters.Add("@name", SqlDbType.VarChar, 50).Value = cat.Name;
                    myCommand.Parameters.Add("@description", SqlDbType.VarChar, 255).Value = cat.Description;
                    myCommand.Parameters.Add("@anonPost", SqlDbType.Bit).Value = cat.AllowAnonymousPost;
                    myCommand.Parameters.Add("@anonTopic", SqlDbType.Bit).Value = cat.AllowAnonymousTopic;
                    myCommand.Parameters.Add("@moderated", SqlDbType.Bit).Value = cat.IsModerated;
                    myCommand.Parameters.Add("@isTeam", SqlDbType.Bit).Value = cat.IsTeam;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
                rowCount = 0;
            }

            return rowCount > 0;
        }

        static public long AddTopic(MessageTopic topic)
        {
            long newTopicId = 0;

            if (topic.TopicTitle.Length == 0)
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateMessageTopic", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = topic.CategoryId;
                    myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = topic.CreatorContactId;
                    myCommand.Parameters.Add("@createDate", SqlDbType.DateTime).Value = topic.CreateDate;
                    myCommand.Parameters.Add("@topicTitle", SqlDbType.VarChar, 100).Value = topic.TopicTitle;
                    myCommand.Parameters.Add("@stickyTopic", SqlDbType.Bit).Value = topic.StickyTopic;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                    {
                        newTopicId = dr.GetInt64(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return newTopicId;
        }

        static public long AddPost(MessagePost post)
        {
            long newPostId = 0;

            if (post.Subject.Length == 0)
                return 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CreateMessagePost", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@topicId", SqlDbType.BigInt).Value = post.TopicId;
                    myCommand.Parameters.Add("@postOrder", SqlDbType.Int).Value = post.Order;
                    myCommand.Parameters.Add("@contactId", SqlDbType.BigInt).Value = post.CreatorContactId;
                    myCommand.Parameters.Add("@postDate", SqlDbType.DateTime).Value = post.CreateDate;
                    myCommand.Parameters.Add("@postText", SqlDbType.Text, post.Text.Length).Value = post.Text;
                    myCommand.Parameters.Add("@editDate", SqlDbType.DateTime).Value = post.EditDate;
                    myCommand.Parameters.Add("@subject", SqlDbType.VarChar, 255).Value = post.Subject;
                    myCommand.Parameters.Add("@categoryId", SqlDbType.BigInt).Value = post.CategoryId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();
                    if (dr.Read())
                    {
                        newPostId = dr.GetInt64(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return newPostId;
        }

        static public bool ModifyPost(MessagePost post)
        {
            int rowCount = 0;

            if (post.Subject.Length == 0)
                return false;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.ModifyMessagePost", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = post.Id;
                    myCommand.Parameters.Add("@postText", SqlDbType.Text, post.Text.Length).Value = post.Text;
                    myCommand.Parameters.Add("@editDate", SqlDbType.DateTime).Value = post.EditDate;
                    myCommand.Parameters.Add("@subject", SqlDbType.VarChar, 255).Value = post.Subject;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return rowCount > 0;
        }

        static public List<MessageTopic> GetTopics(long catId)
        {
            List<MessageTopic> topics = new List<MessageTopic>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageTopics", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = catId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        topics.Add(CreateTopic(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return topics;
        }

        static public List<MessageTopic> GetTopicsWithDetails(long catId)
        {
            List<MessageTopic> topics = new List<MessageTopic>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageTopics", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = catId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        MessageTopic topic = CreateTopic(dr);

                        topic.LastPost = GetLastPostForTopic(topic.Id);
                        topic.NumberOfReplies = GetTopicReplies(topic.Id);

                        topics.Add(topic);
                    }

                    topics.Sort(MessageTopic.CompareMessageTopicByLastPostDate);
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return topics;
        }

        static public MessageTopic GetTopic(long topicId)
        {
            MessageTopic topic = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessageTopic", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@topicId", SqlDbType.BigInt).Value = topicId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        topic = CreateTopic(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return topic;
        }

        static public List<MessagePost> GetPosts(long topicId)
        {
            List<MessagePost> posts = new List<MessagePost>();

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessagePosts", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@topicId", SqlDbType.BigInt).Value = topicId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        posts.Add(CreatePost(dr));
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return posts;
        }

        static public MessagePost GetPost(long postId)
        {
            MessagePost post = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetMessagePost", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@postId", SqlDbType.BigInt).Value = postId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        post = CreatePost(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return post;
        }

        static public MessagePost GetLastPostForCategory(long catId)
        {
            MessagePost post = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLastPostForCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = catId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        post = CreatePost(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return post;
        }

        static public MessagePost GetLastPostForTopic(long topicId)
        {
            MessagePost post = null;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetLastPostForTopic", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@topicId", SqlDbType.BigInt).Value = topicId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        post = CreatePost(dr);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return post;
        }

        static public long GetNumberOfThreadsForCategory(long catId)
        {
            long numThreads = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetNumberOfThreadsForCategory", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@catId", SqlDbType.BigInt).Value = catId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        numThreads = dr.GetInt64(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return numThreads;
        }

        static public int GetTopicReplies(long topicId)
        {
            int numReplies = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.GetNumberOfTopicReplies", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@topicId", SqlDbType.BigInt).Value = topicId;
                    myConnection.Open();
                    myCommand.Prepare();

                    SqlDataReader dr = myCommand.ExecuteReader();

                    while (dr.Read())
                    {
                        numReplies = dr.GetInt32(0);
                    }
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return numReplies;
        }

        static public bool RemoveMessagePost(long id)
        {
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.DeleteMessagePost", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@id", SqlDbType.BigInt).Value = id;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return rowCount > 0;
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
            int rowCount = 0;

            try
            {
                using (SqlConnection myConnection = DBConnection.GetSqlConnection())
                {
                    SqlCommand myCommand = new SqlCommand("dbo.CleanupMessageBoard", myConnection);
                    myCommand.CommandType = System.Data.CommandType.StoredProcedure;
                    myCommand.Parameters.Add("@accountId", SqlDbType.BigInt).Value = accountId;
                    myConnection.Open();
                    myCommand.Prepare();

                    rowCount = myCommand.ExecuteNonQuery();
                }
            }
            catch (SqlException ex)
            {
                Globals.LogException(ex);
            }

            return rowCount;
        }
    }
}