using Elmah;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace SportsManager
{
    public class MvcApplication : System.Web.HttpApplication
    {
        public class ElmahHandlerAttribute : HandleErrorAttribute
        {
            public override void OnException(ExceptionContext filterContext)
            {
                base.OnException(filterContext);

                var controllerName = (string)filterContext.RouteData.Values["controller"];
                var actionName = (string)filterContext.RouteData.Values["action"];

                var model = new HandleErrorInfo(filterContext.Exception, controllerName, actionName);

                var vr = new ViewResult
                {
                    ViewName = View,
                    MasterName = Master,
                    ViewData = new ViewDataDictionary<HandleErrorInfo>(model),
                    TempData = filterContext.Controller.TempData
                };

                if (filterContext.RouteData.Values.ContainsKey("accountId"))
                {
                    long accountId;
                    if (long.TryParse(filterContext.RouteData.Values["accountId"].ToString(), out accountId))
                        Globals.SetupAccountViewData(accountId, vr.ViewData);
                }

                filterContext.Result = vr;

                if (filterContext.ExceptionHandled)
                    ErrorSignal.FromCurrentContext().Raise(filterContext.Exception);
            }
        }
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            Database.SetInitializer<ApplicationDbContext>(new MyDbInitializer());

            GlobalFilters.Filters.Add(new ElmahHandlerAttribute());
        }
    }
}
