using Autofac;
using Autofac.Integration.Mvc;
using AutoMapper;
using DataAccess;
using Elmah;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels;
using SportsManager.ViewModels.API;
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

            // AutoFac IOC
            var builder = new ContainerBuilder();

            // Register your MVC controllers.
            builder.RegisterControllers(typeof(MvcApplication).Assembly);

            builder.RegisterType<DB>()
                   .AsSelf()
                   .InstancePerRequest();

            var container = builder.Build();
            DependencyResolver.SetResolver(new AutofacDependencyResolver(container));

            // autoMapper - map models to view models
            Mapper.CreateMap<DivisionSeason, DivisionViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.DivisionDef.AccountId))
                .ForMember(vm => vm.Name, opt => opt.MapFrom(model => model.DivisionDef.Name));

            Mapper.CreateMap<LeagueSeason, LeagueViewModel>();
            Mapper.CreateMap<LeagueDefinition, LeagueViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.AccountId))
                .ForMember(vm => vm.Name, opt => opt.MapFrom(model => model.Name));

            Mapper.CreateMap<TeamManager, TeamManagerViewModel>()
                .ForMember(vm => vm.TeamName, opt => opt.MapFrom(model => model.TeamsSeason.Name))
                .ForMember(vm => vm.LeagueName, opt => opt.MapFrom(model => model.TeamsSeason.LeagueSeason.League.Name));

            Mapper.CreateMap<TeamSeason, TeamViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.Team.AccountId))
                .ForMember(vm => vm.LeagueName, opt => opt.MapFrom(model => model.LeagueSeason.League.Name));
        }
    }
}
