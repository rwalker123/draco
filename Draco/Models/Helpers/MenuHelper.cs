using System.Collections.Generic;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using ModelObjects;

namespace SportsManager.Models.Helpers
{
    public static class MenuHelper
    {
        public class MenuItem
        {
            public MenuItem()
            {

            }

            public MenuItem(string url, string title, string description)
            {
                Url = url;
                Title = title;
                Description = description;
            }

            public string Url { get; set; }
            public string Title { get; set; }
            public string Description { get; set; }
        }

        /// <summary>
        /// return the Home/About/Contact menu items.
        /// </summary>
        /// <param name="accountType"></param>
        /// <param name="accountId"></param>
        /// <returns></returns>
        public static IEnumerable<MenuItem> GetAccountHomeTypeMenu(long accountType, long accountId)
        {
            if (accountType == (long)Account.AccountType.Baseball)
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
            if (accountType == (long)Account.AccountType.Baseball)
            {
                string teamsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "LeagueTeams", action = "Index", accountId = accountId })).VirtualPath;

                string standingsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Standings", action = "Index", accountId = accountId })).VirtualPath;

                string statsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Statistics", action = "Index", accountId = accountId })).VirtualPath;

                string scheduleurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "LeagueSchedule", action = "Index", accountId = accountId })).VirtualPath;

                string fieldsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Fields", action = "Index", accountId = accountId })).VirtualPath;

                string discussionsurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "Discussions", action = "Index", accountId = accountId })).VirtualPath;

                string memberbusinessurl = RouteTable.Routes.GetVirtualPathForArea(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "baseball", controller = "MemberBusiness", action = "Index", accountId = accountId })).VirtualPath;

                return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>()
	            {
		            //new SportsManager.Models.Helpers.MenuHelper.MenuItem(homeurl, "Home", "Home Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(teamsurl, "Teams", "Teams Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(standingsurl, "Standings", "Standings Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(statsurl, "Statistics", "Statistics Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(scheduleurl, "Schedule", "Schedule Page"),
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(fieldsurl, "Fields", "Fields Page"),
		            //new SportsManager.Models.Helpers.MenuHelper.MenuItem(discussionsurl, "Discussions", "Discussions Page"),
		            //new SportsManager.Models.Helpers.MenuHelper.MenuItem(memberbusinessurl, "Member Business", "Member Business Page")
	            };

            }
            else if (accountType == (long)Account.AccountType.Golf)
            {
                string homeurl = RouteTable.Routes.GetVirtualPath(((MvcHandler)HttpContext.Current.CurrentHandler).RequestContext,
                                    new RouteValueDictionary(new { area = "golf", controller = "League", action = "Home", accountId = accountId })).VirtualPath;

                return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>()
	            {
		            new SportsManager.Models.Helpers.MenuHelper.MenuItem(homeurl, "Home", "Home Page"),
	            };
            }

            return new List<SportsManager.Models.Helpers.MenuHelper.MenuItem>();
        }
    }
}