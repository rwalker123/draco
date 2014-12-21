using ModelObjects;
using SportsManager;
using System.Linq;

namespace DataAccess
{
/// <summary>
/// Summary description for LeagueNews.
/// </summary>
	static public class LeagueNews
	{
		static public LeagueNewsItem GetNewsItem(long newsId)
		{
            //	SELECT * FROM LeagueNews WHERE Id = @id
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.Id == newsId
                    select new LeagueNewsItem()
                    {
                        Id = ln.Id,
                        AccountId = ln.AccountId,
                        Date = ln.Date,
                        SpecialAnnounce = ln.SpecialAnnounce,
                        Text = ln.Text,
                        Title = ln.Title
                    }).SingleOrDefault();
        }

		static public IQueryable<SportsManager.Model.LeagueNew> GetNewsHeadlines(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && !ln.SpecialAnnounce
                    orderby ln.Date descending
                    select ln).Take(3);
		}

		static public IQueryable<LeagueNewsItem> GetNews(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && !ln.SpecialAnnounce
                    orderby ln.Date descending
                    select new LeagueNewsItem()
                    {
                        Id = ln.Id,
                        AccountId = accountId,
                        Date = ln.Date,
                        SpecialAnnounce = ln.SpecialAnnounce,
                        Text = ln.Text,
                        Title = ln.Title
                    });
		}

		static public IQueryable<LeagueNewsItem> GetAllNews(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId
                    orderby ln.Date descending
                    select new LeagueNewsItem()
                    {
                        Id = ln.Id,
                        AccountId = accountId,
                        Date = ln.Date,
                        SpecialAnnounce = ln.SpecialAnnounce,
                        Text = ln.Text,
                        Title = ln.Title
                    });
        }

		static public IQueryable<SportsManager.Model.LeagueNew> GetSpecialAnnouncements(long accountId)
		{
            DB db = DBConnection.GetContext();
            return (from ln in db.LeagueNews
                    where ln.AccountId == accountId && ln.SpecialAnnounce
                    orderby ln.Date descending
                    select ln);
		}

		static public bool ModifyNews(LeagueNewsItem newsItem)
		{
            DB db = DBConnection.GetContext();

            var dbNewsItem = (from n in db.LeagueNews
                              where n.Id == newsItem.Id
                              select n).SingleOrDefault();
            if (dbNewsItem == null)
                return false;

            dbNewsItem.Date = newsItem.Date;
            dbNewsItem.Text = newsItem.Text;
            dbNewsItem.Title = newsItem.Title;
            dbNewsItem.SpecialAnnounce = newsItem.SpecialAnnounce;

            db.SubmitChanges();

            return true;
		}

		static public void AddNews(LeagueNewsItem newsItem)
		{
            DB db = DBConnection.GetContext();

            SportsManager.Model.LeagueNew dbLeagueNews = new SportsManager.Model.LeagueNew();
            newsItem.CopyTo(dbLeagueNews);
            db.LeagueNews.InsertOnSubmit(dbLeagueNews);
            db.SubmitChanges();

            newsItem.Id = dbLeagueNews.Id;
		}

		static public bool RemoveNews(long newsId)
		{
            DB db = DBConnection.GetContext();

            var dbNewsItem = (from n in db.LeagueNews
                              where n.Id == newsId
                              select n).SingleOrDefault();
            if (dbNewsItem == null)
                return false;

            db.LeagueNews.DeleteOnSubmit(dbNewsItem);
            db.SubmitChanges();

            return true;
        }
	}
}