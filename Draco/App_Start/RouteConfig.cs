using Autofac;
using ModelObjects;
using System;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace SportsManager
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.Add(new DomainRoute());

            //routes.MapRoute(
            //    name: "Default",
            //    url: "{controller}/{action}/{id}",
            //    defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
            //);

            routes.MapRoute(
                "Team",                                              // Route name
                "{controller}/{accountId}/{action}/{Id}",     // URL with parameters
                new { controller = "Home", action = "Index" }  // Parameter defaults
            );

            routes.MapRoute(
                "Default",                                              // Route name
                "{controller}/{action}/{accountId}",                    // URL with parameters
                new { controller = "Home", action = "Index", accountId = UrlParameter.Optional }  // Parameter defaults
            );

        }
    }

    /// <summary>
    /// Routes a specific domain to a controller.
    /// </summary>
    public class DomainRoute : RouteBase
    {
        readonly char[] slashSep = new char[] { '/' };

        public override RouteData GetRouteData(HttpContextBase httpContext)
        {
            var db = DependencyResolver.Current.GetService<DB>();

            string url = httpContext.Request.Headers["HOST"];
            long accountId = (from a in db.AccountsURL
                              where a.URL.Contains(url.ToLower())
                              select a.AccountId).SingleOrDefault();

            String virtualPath = System.Web.VirtualPathUtility.ToAbsolute("~/").TrimEnd(slashSep);

            if (accountId == 0)
            {
                // does the url contain ezbaseballleague and point to the root:
                // ex: www.ezbaseballleague.com
                //     ezbaseballleague.azure.websites.com
                // but not: ezbaseballleague.com/Accounts/Logoff/1
                if (url.IndexOf("ezbaseballleague", StringComparison.InvariantCultureIgnoreCase) >= 0 &&
                    httpContext.Request.FilePath.TrimEnd(slashSep).Equals(virtualPath, StringComparison.InvariantCultureIgnoreCase))
                {
                    // route to the "base" url of baseball leagues.
                    var routeData = new RouteData(this, new MvcRouteHandler());
                    routeData.Values["controller"] = "League";
                    routeData.Values["action"] = "Index";

                    routeData.DataTokens["area"] = "Baseball";
                    routeData.DataTokens["namespaces"] = new string[] { "SportsManager.Areas.Baseball.Controllers" };
                    return routeData;
                }
                return null;
            }
            // let login/logoff process normally

            // must add "common" pages here, otherwise code below will set defaults to specific league type.
            if (httpContext.Request.FilePath.StartsWith(virtualPath + "/Account", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/Season", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/Discussions", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/TwitterOauth", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/PlayerSurvey", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/BackupSite", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/LeagueFAQ", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/HallOfFame", System.StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            // Mostly works, need to handle links in ~/Controllers/.., for example, Account/Logon. With this
            // redirect, it would look for logOn in /Areas/baseball/.... How to show "shared" views when you
            // need menus and other things custom for each area.
            var accountType = (from a in db.Accounts
                               join at in db.AccountTypes on a.AccountTypeId equals at.Id
                               where a.Id == accountId
                               select at).SingleOrDefault();

            if (accountType.Id == 1) // baseball
            {
                // route to the "base" url of the specific account.
                var routeData = new RouteData(this, new MvcRouteHandler());
                routeData.Values["controller"] = "League";
                routeData.Values["action"] = "Home";
                routeData.Values["accountId"] = accountId;

                routeData.DataTokens["area"] = "Baseball";
                routeData.DataTokens["namespaces"] = new string[] { "SportsManager.Areas.Baseball.Controllers" };
                return routeData;
            }
            else if (accountType.Id == 3)
            {
                // route to the "base" url of the specific account.
                var routeData = new RouteData(this, new MvcRouteHandler());
                routeData.Values["controller"] = "League";
                routeData.Values["action"] = "Home";
                routeData.Values["accountId"] = accountId;

                routeData.DataTokens["area"] = "Golf";
                routeData.DataTokens["namespaces"] = new string[] { "SportsManager.Areas.Golf.Controllers" };
                return routeData;
            }

            return null;
        }

        public override VirtualPathData GetVirtualPath(RequestContext requestContext, RouteValueDictionary values)
        {
            //Implement your formating Url formating here 
            return null;
        }

    }
}
