using ModelObjects;
using SportsManager;
using System.Linq;

namespace DataAccess
{
	/// <summary>
	/// Summary description for TeamNews.
	/// </summary>
	static public class TeamNews
	{
        static public LeagueNewsItem GetTeamAnnouncement(long newsId)
        {
            DB db = DBConnection.GetContext();

            return (from n in db.TeamNews
                    where n.Id == newsId
                    select new LeagueNewsItem()
                    {
                        Id = n.Id,
                        AccountId = n.TeamId,
                        Date = n.Date,
                        SpecialAnnounce = n.SpecialAnnounce,
                        Text = n.Text,
                        Title = n.Title
                    }).SingleOrDefault();
        }

		static public IQueryable<LeagueNewsItem> GetTeamAnnouncements(long teamSeasonId)
		{
            DB db = DBConnection.GetContext();

            return (from tn in db.TeamNews
                    join ts in db.TeamsSeasons on tn.TeamId equals ts.TeamId
                    where ts.Id == teamSeasonId
                    orderby tn.Date descending
                    select new LeagueNewsItem()
                    {
                        Id = tn.Id,
                        Title = tn.Title,
                        Text = tn.Text,
                        Date = tn.Date,
                        SpecialAnnounce = tn.SpecialAnnounce,
                        AccountId = teamSeasonId
                    });
		}

        static public bool ModifyTeamAnnouncement(LeagueNewsItem newsItem)
		{
            DB db = DBConnection.GetContext();

            var dbItem = (from n in db.TeamNews
                          where n.Id == newsItem.Id
                          select n).SingleOrDefault();
            if (dbItem != null)
            {
                dbItem.Date = newsItem.Date;
                dbItem.Title = newsItem.Title;
                dbItem.Text = newsItem.Text;
                dbItem.SpecialAnnounce = newsItem.SpecialAnnounce;

                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public bool AddTeamAnnouncement(LeagueNewsItem newsItem)
		{
            DB db = DBConnection.GetContext();

            var dbItem = new SportsManager.Model.TeamNew()
            {
                Date = newsItem.Date,
                SpecialAnnounce = newsItem.SpecialAnnounce,
                TeamId = newsItem.AccountId,
                Text = newsItem.Text,
                Title = newsItem.Title
            };

            db.TeamNews.InsertOnSubmit(dbItem);
            db.SubmitChanges();

            newsItem.Id = dbItem.Id;

            return true;
		}

		static public bool RemoveTeamAnnouncement(long newsId)
		{
            DB db = DBConnection.GetContext();

            var dbItem = (from n in db.TeamNews
                          where n.Id == newsId
                          select n).SingleOrDefault();
            if (dbItem == null)
                return false;

            db.TeamNews.DeleteOnSubmit(dbItem);
            db.SubmitChanges();
            return true;
		}
	}
}