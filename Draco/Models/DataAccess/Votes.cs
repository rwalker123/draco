using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;

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

            List<long> existingVoteOptions = new List<long>(GetVoteOptions(voteQuestion.Id).Select(x => x.Id));
            
            var optionIndex = 0;
            foreach(var option in voteQuestion.Results)
            {
                if (option.OptionId > 0)
                {
                    if (existingVoteOptions.Contains(option.OptionId))
                        existingVoteOptions.Remove(option.OptionId);

                    ModifyVoteOption(new VoteOption(option.OptionId, voteQuestion.Id, option.OptionText ?? String.Empty, optionIndex++));
                }
                else
                {
                    var vo = new VoteOption(0, voteQuestion.Id, option.OptionText ?? String.Empty, optionIndex++);
                    AddVoteOption(vo);
                    option.OptionId = vo.Id;
                }
            }

            // delete any remaining options.
            foreach(var oldOption in existingVoteOptions)
            {
                RemoveVoteOption(oldOption);
            }

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
            db.SubmitChanges();

            // add the options
            int optionIndex = 0;
            foreach(var option in voteQuestion.Results)
            {
                var vo = new VoteOption(0, dbVoteQuestion.Id, option.OptionText ?? String.Empty, optionIndex++);
                AddVoteOption(vo);
                option.OptionId = vo.Id;
            }

            voteQuestion.Id = dbVoteQuestion.Id;

            return true;
		}

		static public bool RemoveVoteQuestion(long accountId, long questionId)
		{
            DB db = DBConnection.GetContext();

            var dbVoteQuestion = (from vq in db.VoteQuestions
                                  where vq.AccountId == accountId && vq.Id == questionId
                                  select vq).SingleOrDefault();
            if (dbVoteQuestion == null)
                return false;

            db.VoteQuestions.DeleteOnSubmit(dbVoteQuestion);
            db.SubmitChanges();

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
            db.SubmitChanges();

            return true;
		}

		static public bool EnterVote(long questionId, long optionId, long contactId)
		{
            DB db = DBConnection.GetContext();

            var dbVoteAnswer = (from va in db.VoteAnswers
                                where va.QuestionId == questionId && va.ContactId == contactId
                                select va).SingleOrDefault();

            if (dbVoteAnswer == null)
            {
                //INSERT INTO VoteAnswers VALUES(@questionId, @optionId, @contactId)
                dbVoteAnswer = new SportsManager.Model.VoteAnswer();
                dbVoteAnswer.OptionId = optionId;
                dbVoteAnswer.QuestionId = questionId;
                dbVoteAnswer.ContactId = contactId;

                db.VoteAnswers.InsertOnSubmit(dbVoteAnswer);
            }
            else
            {
                dbVoteAnswer.OptionId = optionId;       
            }

            db.SubmitChanges();

            return true;
		}

		static private IEnumerable<VoteResults> GetVoteResults(long questionId)
		{
            DB db = DBConnection.GetContext();

            //SELECT VoteAnswers.OptionID, VoteOptions.OptionText, COUNT(*) AS Votes  
            //FROM VoteAnswers LEFT JOIN VoteOptions ON VoteAnswers.OptionID = VoteOptions.ID 
            //WHERE VoteAnswers.QuestionID = @questionId GROUP BY OptionID , OptionText ORDER BY Votes DESC

            string queryString = @"select VoteOptions.Id As OptionId, VoteOptions.OptionText, COUNT(VoteAnswers.Id) As TotalVotes
                                    from VoteQuestion
                                    left join VoteOptions on VoteQuestion.Id = VoteOptions.QuestionId
                                    left join VoteAnswers on VoteOptions.id = VoteAnswers.OptionId
                                    where VoteQuestion.Id = {0}
                                    group by VoteOptions.Id, VoteOptions.OptionText, VoteOptions.Priority
                                    order by VoteOptions.Priority";

            var result = (IEnumerable<VoteResults>)db.ExecuteQuery(typeof(VoteResults), queryString, new object[] { questionId });

            return result;

            //return (from vq in db.VoteQuestions
            //        join vo in db.VoteOptions on vq.Id equals vo.QuestionId
            //        join va in db.VoteAnswers on vo.Id equals va.OptionId
            //        where vq.Id == questionId
            //        group new { vo, va.Id } by new { vo.Id, vo.OptionText } into g
            //        select new VoteResults()
            //        {
            //            OptionId = g.Key.Id,
            //            OptionText = g.Key.OptionText,
            //            TotalVotes = g.Select(x => x.Id).Count()
            //        });
		}

        static public IQueryable<VoteQuestion> GetActiveVotesWithResults(long accountId)
        {
            DB db = DBConnection.GetContext();

            var contactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());

            return (from vq in db.VoteQuestions
                    where vq.AccountId == accountId && vq.Active
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = vq.AccountId,
                        Active = vq.Active,
                        Question = vq.Question,
                        Results = GetVoteResults(vq.Id),
                        HasVoted = HasVoted(vq.Id, contactId),
                        OptionSelected = UserVoteOption(vq.Id, contactId)
                    });
        }

        static public IQueryable<VoteQuestion> GetVotesWithResults(long accountId)
        {
            DB db = DBConnection.GetContext();

            var contactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());

            return (from vq in db.VoteQuestions
                    where vq.AccountId == accountId
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = vq.AccountId,
                        Active = vq.Active,
                        Question = vq.Question,
                        Results = GetVoteResults(vq.Id),
                        HasVoted = HasVoted(vq.Id, contactId),
                        OptionSelected = UserVoteOption(vq.Id, contactId)
                    });
        }

        static public VoteQuestion GetVoteWithResults(long accountId, long questionId)
        {
            DB db = DBConnection.GetContext();

            var contactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());

            return (from vq in db.VoteQuestions
                    where vq.AccountId == accountId && vq.Id == questionId
                    select new VoteQuestion()
                    {
                        Id = vq.Id,
                        AccountId = vq.AccountId,
                        Active = vq.Active,
                        Question = vq.Question,
                        Results = GetVoteResults(vq.Id),
                        HasVoted = HasVoted(vq.Id, contactId),
                        OptionSelected = UserVoteOption(vq.Id, contactId)
                    }).SingleOrDefault();
        }

        static public long UserVoteOption(long questionId, long contactId)
        {
            DB db = DBConnection.GetContext();

            //SELECT Count(Id)
            //FROM VoteAnswers 
            //WHERE QuestionId = @questionId AND ContactId = @contactId
            return (from va in db.VoteAnswers
                    where va.QuestionId == questionId && va.ContactId == contactId
                    select va.OptionId).SingleOrDefault();			
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