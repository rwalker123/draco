using System;
using System.Collections.Generic;
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
        public override RouteData GetRouteData(HttpContextBase httpContext)
        {
            string url = httpContext.Request.Headers["HOST"];
            long accountId = DataAccess.Accounts.GetAccountIdFromUrl(url);

            if (accountId == 0)
                return null;

            // let login/logoff process normally

            String virtualPath = System.Web.VirtualPathUtility.ToAbsolute("~/").TrimEnd(new char[] { '/' });

            if (httpContext.Request.FilePath.StartsWith(virtualPath + "/Account", System.StringComparison.InvariantCultureIgnoreCase) ||
                httpContext.Request.FilePath.StartsWith(virtualPath + "/Season", System.StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            // Mostly works, need to handle links in ~/Controllers/.., for example, Account/Logon. With this
            // redirect, it would look for logOn in /Areas/baseball/.... How to show "shared" views when you
            // need menus and other things custom for each area.
            ModelObjects.AccountType accountType = DataAccess.Accounts.GetAccountType(accountId);
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
