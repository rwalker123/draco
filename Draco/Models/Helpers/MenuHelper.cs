using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace SportsManager.Models.Helpers
{
    public static class MenuHelper
    {
        public class MenuItem
        {
            private List<MenuItem> m_subMenuItems = new List<MenuItem>();
            public MenuItem()
            {

            }

            public MenuItem(string url, string title, string description)
            {
                Url = url;
                Title = title;
                Description = description;
            }

            public void AddSubMenu(MenuItem subMenu)
            {
                m_subMenuItems.Add(subMenu);
            }

            public IEnumerable<MenuItem> SubMenuItems
            {
                get { return m_subMenuItems; }
            }

            public string Url { get; set; }
            public string Title { get; set; }
            public string Description { get; set; }
        }

        private class dbHelper : Controllers.IDb
        {
            public dbHelper()
            {
                Db = DependencyResolver.Current.GetService<DB>();
            }

            public DB Db
            {
                get; private set;
            }
        }

        /// <summary>
        /// return the Home/About/Contact menu items.
        /// </summary>
        /// <param name="accountType"></param>
        /// <param name="accountId"></param>
        /// <returns></returns>
        public static IEnumerable<MenuItem> GetAccountHomeTypeMenu(long accountType, long accountId)
        {
            if (accountType == (long)Account.eAccountType.Baseball)
            {
                string homeurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                new RouteValueDictionary(new { area = "baseball", controller = "League", action = "Home", accountId = accountId })).VirtualPath;

                string abouturl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                            new RouteValueDictionary(new { area = "baseball", controller = "League", action = "About", accountId = accountId })).VirtualPath;

                string contacturl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                new RouteValueDictionary(new { area = "baseball", controller = "League", action = "Contact", accountId = accountId })).VirtualPath;


                return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>()
	            {
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(homeurl, "Home", "Home Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(abouturl, "About", "About Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(contacturl, "Contact", "Contact Page"),
                };
            }

            return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>();
        }

        public static IEnumerable<MenuItem> GetAccountTypeMenu(long accountType, long accountId)
        {
            var db = new dbHelper();

            if (accountType == (long)Account.eAccountType.Baseball)
            {
                string teamsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "LeagueTeams", action = "Index", accountId = accountId })).VirtualPath;

                string standingsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Standings", action = "Index", accountId = accountId })).VirtualPath;

                string faqurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "", controller = "LeagueFAQ", action = "Index", accountId = accountId })).VirtualPath;

                string statsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Statistics", action = "Index", accountId = accountId })).VirtualPath;

                string hofurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                   new RouteValueDictionary(new { area = "", controller = "HallOfFame", action = "Index", accountId = accountId })).VirtualPath;

                string scheduleurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "LeagueSchedule", action = "Index", accountId = accountId })).VirtualPath;

                string fieldsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Fields", action = "Index", accountId = accountId })).VirtualPath;

                string discussionsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "", controller = "Discussions", action = "Index", accountId = accountId })).VirtualPath;

                var forumsMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(discussionsurl, "Discussions", "Community");

                var showPlayerClassified = false;
                bool.TryParse(db.GetAccountSetting(accountId, "ShowPlayerClassified"), out showPlayerClassified);
                if (showPlayerClassified)
                {
                    string playerclassifiedurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                        new RouteValueDictionary(new { area = "baseball", controller = "PlayerClassified", action = "Index", accountId = accountId })).VirtualPath;

                    forumsMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(playerclassifiedurl, "Player Classified", "Players wanting to play and needed"));
                }

                var showPlayerSurvey = false;
                bool.TryParse(db.GetAccountSetting(accountId, "ShowPlayerSurvey"), out showPlayerSurvey);
                if (showPlayerSurvey)
                {
                    string playersurveyurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                        new RouteValueDictionary(new { area = "", controller = "PlayerSurvey", action = "Index", accountId = accountId })).VirtualPath;

                    forumsMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(playersurveyurl, "Player Survey", "Player Survey Page"));
                }

                var showMemberBusiness = false;
                bool.TryParse(db.GetAccountSetting(accountId, "ShowBusinessDirectory"), out showMemberBusiness);
                if (showMemberBusiness)
                {
                    string memberbusinessurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                        new RouteValueDictionary(new { area = "baseball", controller = "MemberBusiness", action = "Index", accountId = accountId })).VirtualPath;

                    forumsMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(memberbusinessurl, "Member Business", "Member Business Page"));
                }

                var scheduleMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(scheduleurl, "Schedule", "Schedule");
                scheduleMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(fieldsurl, "Fields", "Fields Page"));

                //var homeMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(homeurl, "Home", "Home Page");
                //homeMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(abouturl, "About", "About Page"));
                //homeMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(contacturl, "Contact", "Contact Page"));

                var teamsMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(teamsurl, "Teams", "Teams");

                var leagueMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(standingsurl, "Standings", "League");
                leagueMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(statsurl, "Statistics", "Statistics Page"));


                var showHOF = false;
                bool.TryParse(db.GetAccountSetting(accountId, "ShowHOF"), out showHOF);
                if (showHOF)
                {
                    leagueMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(hofurl, "Hall of Fame", "Hall of Fame Page"));
                }

                if (db.Db.LeagueFaqs.Where(lf => lf.AccountId == accountId).Any())
                {
                    leagueMenu.AddSubMenu(new SportsManager.Models.Helpers.MenuHelper.MenuItem(faqurl, "League FAQ", "FAQ Page"));
                }

                return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>()
	            {
                    //homeMenu,
		            teamsMenu,
                    leagueMenu,
		            scheduleMenu,
		            forumsMenu		            
	            };

            }
            else if (accountType == (long)Account.eAccountType.Golf)
            {
                string coursesurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "golf", controller = "Courses", action = "Index", accountId = accountId })).VirtualPath;

                string discussionsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "", controller = "Discussions", action = "Index", accountId = accountId })).VirtualPath;

                var forumsMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(discussionsurl, "Discussions", "Community");

                var coursesMenu = new SportsManager.Models.Helpers.MenuHelper.MenuItem(coursesurl, "Courses", "Courses");
                return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>()
                {
                    coursesMenu,
                    forumsMenu
                };
            }

            return new List<MenuHelper.MenuItem>();
        }
    }
}