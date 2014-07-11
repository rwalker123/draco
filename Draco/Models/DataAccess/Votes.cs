using System;
using System.Data;
using System.Collections;
using System.Data.SqlClient;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using SportsManager;

namespace DataAccess
{
/// <summary>
/// Summary description for Votes
/// </summary>
	static public class Votes
	{
		static public IQueryable<VoteQuestion> GetVoteQuestions(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from vq in db.VoteQuestions
                    where vq.AccountId == accountId
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = accountId,
                        Active = vq.Active,
                        Question = vq.Question
                    });
		}

		static public VoteQuestion GetVoteQuestion(long id)
		{
            DB db = DBConnection.GetContext();

            return (from vq in db.VoteQuestions
                    where vq.Id == id
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = vq.AccountId,
                        Active = vq.Active,
                        Question = vq.Question
                    }).SingleOrDefault();
		}

		static public IQueryable<VoteQuestion> GetActiveVotes(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from vq in db.VoteQuestions
                    where vq.AccountId == accountId && vq.Active
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = vq.AccountId,
                        Active = vq.Active,
                        Question = vq.Question
                    });
		}

		static public bool ModifyVoteQuestion(VoteQuestion voteQuestion)
		{
            DB db = DBConnection.GetContext();
	        // Update VoteQuestion SET Question = @question, Active = @active WHERE ID = @id

            var dbQuestion = (from vq in db.VoteQuestions
                              where vq.Id == voteQuestion.Id
                              select vq).SingleOrDefault();
            if (dbQuestion == null)
                return false;

            dbQuestion.Question = voteQuestion.Question;
            dbQuestion.Active = voteQuestion.Active;
            db.SubmitChanges();

            return true;
		}

		static public bool AddVoteQuestion(VoteQuestion voteQuestion)
		{
            DB db = DBConnection.GetContext();

            SportsManager.Model.VoteQuestion dbVoteQuestion = new SportsManager.Model.VoteQuestion();
            dbVoteQuestion.AccountId = voteQuestion.AccountId;
            dbVoteQuestion.Question = voteQuestion.Question;
            dbVoteQuestion.Active = voteQuestion.Active;
            db.VoteQuestions.InsertOnSubmit(dbVoteQuestion);

            voteQuestion.Id = dbVoteQuestion.Id;

            return true;
		}

		static public bool RemoveVoteQuestion(long questionId)
		{
            DB db = DBConnection.GetContext();

            var dbVoteQuestion = (from vq in db.VoteQuestions
                                  where vq.Id == questionId
                                  select vq).SingleOrDefault();
            if (dbVoteQuestion == null)
                return false;

            db.VoteQuestions.DeleteOnSubmit(dbVoteQuestion);

            return true;
		}

		static public IQueryable<VoteOption> GetVoteOptions(long questionId)
		{
            DB db = DBConnection.GetContext();

	        // SELECT * FROM VoteOptions WHERE QuestionID = @questionId ORDER BY Priority            
            return (from vo in db.VoteOptions
                    where vo.QuestionId == questionId
                    orderby vo.Priority
                    select new VoteOption()
                    {
                        Id = vo.Id,
                        OptionText = vo.OptionText,
                        Priority = vo.Priority,
                        QuestionId = vo.QuestionId
                    });
		}

		static public bool ModifyVoteOption(VoteOption voteOption)
		{
            DB db = DBConnection.GetContext();

            var dbOption = (from vo in db.VoteOptions
                            where vo.Id == voteOption.Id
                            select vo).SingleOrDefault();
            if (dbOption == null)
                return false;

            dbOption.OptionText = voteOption.OptionText;
            dbOption.Priority = voteOption.Priority;
            db.SubmitChanges();

            return true;
		}

		static public bool AddVoteOption(VoteOption voteOption)
		{
            DB db = DBConnection.GetContext();

            var dbVoteOption = new SportsManager.Model.VoteOption();
            dbVoteOption.OptionText = voteOption.OptionText;
            dbVoteOption.Priority = voteOption.Priority;
            dbVoteOption.QuestionId = voteOption.QuestionId;

            db.VoteOptions.InsertOnSubmit(dbVoteOption);
            db.SubmitChanges();

            voteOption.Id = dbVoteOption.Id;

            return true;
            
		}

		static public bool RemoveVoteOption(long id)
		{
            DB db = DBConnection.GetContext();

            var dbVoteOption = (from vo in db.VoteOptions
                                where vo.Id == id
                                select vo).SingleOrDefault();
            if (dbVoteOption == null)
                return false;

            db.VoteOptions.DeleteOnSubmit(dbVoteOption);
            return true;
		}

		static public bool EnterVote(long questionId, long optionId, long contactId)
		{
            DB db = DBConnection.GetContext();

            //INSERT INTO VoteAnswers VALUES(@questionId, @optionId, @contactId)
            var dbVoteAnswers = new SportsManager.Model.VoteAnswer();
            dbVoteAnswers.OptionId = optionId;
            dbVoteAnswers.QuestionId = questionId;
            dbVoteAnswers.ContactId = contactId;

            db.VoteAnswers.DeleteOnSubmit(dbVoteAnswers);

            return true;
		}

		static public IQueryable<VoteResults> GetVoteResults(long questionId)
		{
            DB db = DBConnection.GetContext();

            //SELECT VoteAnswers.OptionID, VoteOptions.OptionText, COUNT(*) AS Votes  
            //FROM VoteAnswers LEFT JOIN VoteOptions ON VoteAnswers.OptionID = VoteOptions.ID 
            //WHERE VoteAnswers.QuestionID = @questionId GROUP BY OptionID , OptionText ORDER BY Votes DESC

            return (from va in db.VoteAnswers
                    join vo in db.VoteOptions on va.OptionId equals vo.Id
                    where va.QuestionId == questionId
                    group va by new { va.OptionId, vo.OptionText } into g
                    select new VoteResults()
                    {
                        OptionId = g.Key.OptionId,
                        OptionText = g.Key.OptionText,
                        TotalVotes = g.Count()
                    });
		}

		static public bool HasVoted(long questionId, long contactId)
		{
            DB db = DBConnection.GetContext();
            
            //SELECT Count(Id)
            //FROM VoteAnswers 
            //WHERE QuestionId = @questionId AND ContactId = @contactId
            return (from va in db.VoteAnswers
                    where va.QuestionId == questionId && va.ContactId == contactId
                    select va).Any();			
		}

		static public int GetTotalVotes(long questionId)
		{
            DB db = DBConnection.GetContext();

            //SELECT COUNT(*) AS cnt 
            //FROM VoteAnswers 
            //WHERE QuestionId = @questionId
            return (from va in db.VoteAnswers
                    where va.QuestionId == questionId
                    select va).Count();
		}
	}
}