using DataAccess;
using SportsManager.Model;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class AnnouncementsViewModel : AccountViewModel
    {
        List<LeagueNew> m_specialAnnouncments;
        List<LeagueNew> m_headlineLinks;
        List<LeagueNew> m_otherLinks;

        const int NumHeadlineLinks = 3;

        public AnnouncementsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            m_specialAnnouncments = new List<LeagueNew>();
            m_headlineLinks = new List<LeagueNew>();
            m_otherLinks = new List<LeagueNew>();

            var allNews = LeagueNews.GetAllNews(accountId);
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

        public IEnumerable<LeagueNew> OtherNews
        {
            get
            {
                return m_headlineLinks;
            }
        }

        public IEnumerable<LeagueNew> SpecialAnnouncements
        {
            get
            {
                return m_specialAnnouncments;
            }
        }

        public IEnumerable<LeagueNew> OlderNews
        {
            get
            {
                return m_otherLinks;
            }
        }
    }
}