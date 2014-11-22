using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{
/// <summary>
/// Summary description for ProfileAdmin
/// </summary>
	static public class ProfileAdmin
	{
        private class PlayerProfileEquality : IEqualityComparer<PlayerProfile>
        {
            public bool Equals(PlayerProfile x, PlayerProfile y)
            {
                return x.PlayerId == y.PlayerId;
            }

            public int GetHashCode(PlayerProfile obj)
            {
                throw new NotImplementedException();
            }
        }


		static public IQueryable<ProfileCategoryItem> GetCategories(long accountId)
		{	
            DB db = DBConnection.GetContext();

            //SELECT * FROM ProfileCategory WHERE AccountId = @accountId ORDER BY Priority
            return (from pc in db.ProfileCategories
                    where pc.AccountId == accountId
                    orderby pc.Priority
                    select new ProfileCategoryItem(pc.Id, pc.CategoryName, pc.Priority, pc.AccountId)
                    {
                        Questions = (from pq in pc.ProfileQuestions
                                     orderby pq.QuestionNum, pq.Question
                                     select new ProfileQuestionItem(pq.Id, pq.CategoryId, pq.Question, pq.QuestionNum))
                    });
		}

		static public bool ModifyCategory(ProfileCategoryItem item)
		{
            if (item.AccountId <= 0 || String.IsNullOrEmpty(item.CategoryName))
                return false;

            DB db = DBConnection.GetContext();

            var dbCategory = (from pc in db.ProfileCategories
                              where pc.Id == item.Id
                              select pc).SingleOrDefault();

            if (dbCategory == null)
                return false;

            dbCategory.CategoryName = item.CategoryName;
            dbCategory.Priority = item.Priority;

            db.SubmitChanges();

            return true;
        }

		static public bool AddCategory(ProfileCategoryItem item)
		{
	        //INSERT INTO ProfileCategory VALUES(@accountId, @category, @priority)
            if (item.AccountId <= 0 || String.IsNullOrEmpty(item.CategoryName))
                return false;

            DB db = DBConnection.GetContext();

            var dbCategory = new SportsManager.Model.ProfileCategory();
            dbCategory.AccountId = item.AccountId;
            dbCategory.CategoryName = item.CategoryName;
            dbCategory.Priority = item.Priority;

            db.ProfileCategories.InsertOnSubmit(dbCategory);
            db.SubmitChanges();

            item.Id = dbCategory.Id;

            return true;
		}

		static public bool RemoveCategory(long categoryId)
		{
            DB db = DBConnection.GetContext();

            var dbCategory = (from pc in db.ProfileCategories
                              where pc.Id == categoryId
                              select pc).SingleOrDefault();

            if (dbCategory == null)
                return false;

            db.ProfileCategories.DeleteOnSubmit(dbCategory);
            db.SubmitChanges();

            return true;
		}

        static public ProfileQuestionItem GetQuestion(long questionId)
        {
            DB db = DBConnection.GetContext();

            //SELECT * FROM ProfileQuestion WHERE CategoryId = @catId ORDER BY QuestionNum
            return (from pq in db.ProfileQuestions
                    where pq.Id == questionId
                    select new ProfileQuestionItem(pq.Id, pq.CategoryId, pq.Question, pq.QuestionNum)).SingleOrDefault();
        }

		static public IQueryable<ProfileQuestionItem> GetQuestions(long catId)
		{
            DB db = DBConnection.GetContext();

	        //SELECT * FROM ProfileQuestion WHERE CategoryId = @catId ORDER BY QuestionNum
            return (from pq in db.ProfileQuestions
                    where pq.CategoryId == catId
                    orderby pq.QuestionNum
                    select new ProfileQuestionItem(pq.Id, pq.CategoryId, pq.Question, pq.QuestionNum));
		}

		static public bool ModifyQuestion(ProfileQuestionItem item)
		{
            DB db = DBConnection.GetContext();

            var dbQuestion = (from pq in db.ProfileQuestions
                              where pq.Id == item.Id
                              select pq).SingleOrDefault();
            
            if (dbQuestion == null)
                return false;

            dbQuestion.QuestionNum = item.QuestionNum;
            dbQuestion.Question = item.Question;

            db.SubmitChanges();

            return true;
		}

		static public bool AddQuestion(ProfileQuestionItem item)
		{
            if (String.IsNullOrEmpty(item.Question))
                return false;

            DB db = DBConnection.GetContext();

            var dbQuestion = new SportsManager.Model.ProfileQuestion();
            dbQuestion.CategoryId = item.CategoryId;
            dbQuestion.Question = item.Question;
            dbQuestion.QuestionNum = item.QuestionNum;

            db.ProfileQuestions.InsertOnSubmit(dbQuestion);

            db.SubmitChanges();

            item.Id = dbQuestion.Id;
            return true;
		}

		static public bool RemoveQuestion(long questionId)
		{
            DB db = DBConnection.GetContext();

            var dbQuestion = (from pq in db.ProfileQuestions
                              where pq.Id == questionId
                              select pq).SingleOrDefault();

            if (dbQuestion == null)
                return false;

            db.ProfileQuestions.DeleteOnSubmit(dbQuestion);
            db.SubmitChanges();

            return true;
		}

        static public IQueryable<PlayerProfile> GetTeamPlayersWithProfiles(long accountId, long teamSeasonId)
        {
            //SELECT DISTINCT PlayerId, Contacts.LastName, Contacts.FirstName, Contacts.MiddleName
            //FROM PlayerProfile LEFT JOIN Contacts ON Contacts.Id = PlayerProfile.PlayerId
            //                   LEFT JOIN Roster ON Contacts.Id = Roster.ContactId
            //WHERE Roster.AccountId = @accountId ORDER BY Contacts.LastName, Contacts.FirstName, Contacts.MiddleName
            DB db = DBConnection.GetContext();

            var currentSeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);

            return (from pp in db.PlayerProfiles
                    join c in db.Contacts on pp.PlayerId equals c.Id
                    join r in db.Rosters on c.Id equals r.ContactId
                    join rs in db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where r.AccountId == accountId && ls.SeasonId == currentSeasonId &&
                    ts.Id == teamSeasonId
                    select new PlayerProfile()
                    {
                        PlayerId = pp.PlayerId,
                        LastName = c.LastName,
                        FirstName = c.FirstName,
                        MiddleName = c.MiddleName ?? String.Empty,
                        PhotoUrl = Contact.GetPhotoURL(c.Id)
                    }).Distinct().OrderBy(x => x.LastName).ThenBy(x => x.FirstName);
        }

		static public IQueryable<PlayerProfile> GetPlayersWithProfiles(long accountId)
		{
            //SELECT DISTINCT PlayerId, Contacts.LastName, Contacts.FirstName, Contacts.MiddleName
            //FROM PlayerProfile LEFT JOIN Contacts ON Contacts.Id = PlayerProfile.PlayerId
            //                   LEFT JOIN Roster ON Contacts.Id = Roster.ContactId
            //WHERE Roster.AccountId = @accountId ORDER BY Contacts.LastName, Contacts.FirstName, Contacts.MiddleName
            DB db = DBConnection.GetContext();

            var currentSeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);

            return (
                from pp in db.PlayerProfiles
                join c in db.Contacts on pp.PlayerId equals c.Id
                join r in db.Rosters on c.Id equals r.ContactId
                join rs in db.RosterSeasons on r.Id equals rs.PlayerId
                join ts in db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                join ls in db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                where r.AccountId == accountId && ls.SeasonId == currentSeasonId
                select new PlayerProfile()
                {
                    PlayerId = pp.PlayerId,
                    LastName = c.LastName,
                    FirstName = c.FirstName,
                    MiddleName = c.MiddleName ?? String.Empty,
                    PhotoUrl = Contact.GetPhotoURL(c.Id)
                }).Distinct().OrderBy(x => x.LastName).ThenBy(x => x.FirstName);
		}

        static public bool UpdatePlayerQuestionAnswer(long accountId, ProfileQuestionAnswer answer)
        {
            DB db = DBConnection.GetContext();

            var questionAnswer = (from pp in db.PlayerProfiles
                                  where pp.PlayerId == answer.PlayerId && pp.QuestionId == answer.QuestionId
                                  select pp).SingleOrDefault();

            if (questionAnswer == null)
            {
                if (String.IsNullOrEmpty(answer.Answer))
                    return false;

                questionAnswer = new SportsManager.Model.PlayerProfile();

                questionAnswer.PlayerId = answer.PlayerId;
                questionAnswer.QuestionId = answer.QuestionId;
                questionAnswer.Answer = answer.Answer;

                db.PlayerProfiles.InsertOnSubmit(questionAnswer);
            }
            else
            {
                // no answer, just delete the questionAnswer.
                if (String.IsNullOrEmpty(answer.Answer))
                {
                    db.PlayerProfiles.DeleteOnSubmit(questionAnswer);
                    db.SubmitChanges();

                    answer.Id = 0;

                    return true;
                }
                questionAnswer.Answer = answer.Answer;
            }

            db.SubmitChanges();
            answer.Id = questionAnswer.Id;

            return true;
        }

		static public IQueryable<ProfileQuestionAnswer> GetPlayerQuestionAnswer(long accountId, long playerId)
		{
            DB db = DBConnection.GetContext();

            //SELECT PlayerProfile.PlayerId, ProfileQuestion.Question, PlayerProfile.Answer
            //FROM PlayerProfile LEFT JOIN ProfileQuestion ON ProfileQuestion.Id = PlayerProfile.QuestionId
            //WHERE PlayerId = @playerId	
            //ORDER BY ProfileQuestion.QuestionNum
            return (//from pp in db.PlayerProfiles
                    //join pq in db.ProfileQuestions on pp.QuestionId equals pq.Id
                    from pc in db.ProfileCategories
                    join pq in db.ProfileQuestions on pc.Id equals pq.CategoryId
                    join pp in db.PlayerProfiles on pq.Id equals pp.QuestionId
                    where pp.PlayerId == playerId && pp.Answer != null
                    orderby pc.Priority, pq.QuestionNum
                    select new ProfileQuestionAnswer(pp.Id, pp.PlayerId, pp.QuestionId, pp.Answer));
		}

		static public PlayerProfile GetProfileSpotlight(long accountId)
		{
            DB db = DBConnection.GetContext();

            var qry = DataAccess.ProfileAdmin.GetPlayersWithProfiles(accountId);

            int count = qry.Count();
            int index = new Random().Next(count);

            return qry.Skip(index).FirstOrDefault();
		}

        static public PlayerProfile GetTeamProfileSpotlight(long accountId, long teamSeasonId)
        {
            DB db = DBConnection.GetContext();

            var qry = DataAccess.ProfileAdmin.GetTeamPlayersWithProfiles(accountId, teamSeasonId);

            int count = qry.Count();
            int index = new Random().Next(count);

            return qry.Skip(index).FirstOrDefault();
        }
    }
}
