using ModelObjects;
using SportsManager;
using System.Linq;

namespace DataAccess
{
/// <summary>
/// Summary description for LeagueFAQ
/// </summary>
	static public class LeagueFAQ
	{
		static public LeagueFAQItem GetFAQItem(long faqId)
		{
            DB db = DBConnection.GetContext();

            return (from faq in db.LeagueFAQs
                    where faq.id == faqId
                    select new LeagueFAQItem(faq.id, faq.Question, faq.Answer, faq.AccountId)).SingleOrDefault();
		}

		static public IQueryable<LeagueFAQItem> GetFAQ(long accountId)
		{
            DB db = DBConnection.GetContext();

            return (from faq in db.LeagueFAQs
                    where faq.AccountId == accountId
                    select new LeagueFAQItem(faq.id, faq.Question, faq.Answer, faq.AccountId));
        }

		static public bool ModifyFAQ(LeagueFAQItem modFaq)
		{
            DB db = DBConnection.GetContext();

            var dbFaq = (from faq in db.LeagueFAQs
                         where faq.id == modFaq.Id
                         select faq).SingleOrDefault();

            if (dbFaq == null)
                return false;

            dbFaq.Answer = modFaq.Answer;
            dbFaq.Question = modFaq.Question;

            db.SubmitChanges();

            return true;
		}

		static public bool AddFAQ(LeagueFAQItem faq)
		{
            DB db = DBConnection.GetContext();

            var dbFaq = new SportsManager.Model.LeagueFAQ();
            dbFaq.AccountId = faq.AccountId;
            dbFaq.Question = faq.Question;
            dbFaq.Answer = faq.Answer;

            db.LeagueFAQs.InsertOnSubmit(dbFaq);
            db.SubmitChanges();

            faq.Id = dbFaq.id;

            return true;
		}

		static public bool RemoveFAQ(long faqId)
		{
            DB db = DBConnection.GetContext();

            var dbFaq = (from faq in db.LeagueFAQs
                         where faq.id == faqId
                         select faq).SingleOrDefault();
            if (dbFaq == null)
                return false;

            db.LeagueFAQs.DeleteOnSubmit(dbFaq);
            db.SubmitChanges();

            return true;
		}
	}
}