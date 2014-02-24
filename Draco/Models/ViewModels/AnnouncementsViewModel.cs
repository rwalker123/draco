using DataAccess;
using ModelObjects;
using SportsManager.Model;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class AnnouncementsViewModel : AccountViewModel
    {
        List<LeagueNewsItem> m_specialAnnouncments = new List<LeagueNewsItem>();
        List<LeagueNewsItem> m_headlineLinks = new List<LeagueNewsItem>();
        List<LeagueNewsItem> m_otherLinks = new List<LeagueNewsItem>();

        const int NumHeadlineLinks = 3;

        public AnnouncementsViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            var allNews = DataAccess.TeamNews.GetTeamAnnouncements(teamSeasonId);
            ProcessNews(allNews);

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            }            
        }

        public AnnouncementsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            var allNews = LeagueNews.GetAllNews(accountId);
            ProcessNews(allNews);
        }

        public void ProcessNews(IQueryable<LeagueNewsItem> allNews)
        {
            foreach (var news in allNews)
            {
                if (news.SpecialAnnounce)
                    m_specialAnnouncments.Add(news);
                else if (m_headlineLinks.Count < NumHeadlineLinks)
                    m_headlineLinks.Add(news);
                else
                    m_otherLinks.Add(news);
            }

            HasAnnouncements = (SpecialAnnouncements.Any() || OtherNews.Any() || OlderNews.Any());
        }

        public string OtherNewsDateFmt
        {
            get { return "MMM d, yyyy"; }
        }

        public bool HasAnnouncements
        {
            get;
            private set;
        }

        public IEnumerable<LeagueNewsItem> OtherNews
        {
            get
            {
                return m_headlineLinks;
            }
        }

        public IEnumerable<LeagueNewsItem> SpecialAnnouncements
        {
            get
            {
                return m_specialAnnouncments;
            }
        }

        public IEnumerable<LeagueNewsItem> OlderNews
        {
            get
            {
                return m_otherLinks;
            }
        }
    }
}