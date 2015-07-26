using Autofac;
using Autofac.Integration.Mvc;
using AutoMapper;
using Elmah;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System.Data.Entity;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Linq;

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

            Mapper.CreateMap<DivisionSeason, DivisionSetupViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.DivisionDef.AccountId))
                .ForMember(vm => vm.DivisionDefId, opt => opt.MapFrom(model => model.DivisionId))
                .ForMember(vm => vm.Teams, opt => opt.MapFrom(model => model.TeamsSeasons));

            Mapper.CreateMap<LeagueNewsItem, NewsViewModel>();
            Mapper.CreateMap<TeamNewsItem, NewsViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.TeamId));

            Mapper.CreateMap<Contact, ContactViewModel>();

            Mapper.CreateMap<Contact, ContactNameViewModel>()
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.Id)));

            Mapper.CreateMap<MessagePost, MessagePostViewModel>()
                .ForMember(vm => vm.CreatorName, opt => opt.MapFrom(model => model.Contact.FirstName + " " + model.Contact.LastName))
                .ForMember(vm => vm.Order, opt => opt.MapFrom(model => model.PostOrder))
                .ForMember(vm => vm.CreateDate, opt => opt.MapFrom(model => model.PostDate))
                .ForMember(vm => vm.Subject, opt => opt.MapFrom(model => model.PostSubject))
                .ForMember(vm => vm.Text, opt => opt.MapFrom(model => model.PostText));

            Mapper.CreateMap<MessageCategory, MessageCategoryViewModel>()
                .ForMember(vm => vm.Order, opt => opt.MapFrom(model => model.CategoryOrder))
                .ForMember(vm => vm.Name, opt => opt.MapFrom(model => model.CategoryName))
                .ForMember(vm => vm.Description, opt => opt.MapFrom(model => model.CategoryDescription))
                .ForMember(vm => vm.LastPost, opt => opt.MapFrom(model => model.MessagePosts.OrderByDescending(mp => mp.PostDate).FirstOrDefault()))
                .ForMember(vm => vm.NumberOfThreads, opt => opt.MapFrom(model => model.MessageTopics.LongCount()));

            Mapper.CreateMap<MessageTopic, MessageTopicViewModel>()
                .ForMember(vm => vm.NumberOfReplies, opt => opt.MapFrom(model => model.MessagePosts.Count()))
                .ForMember(vm => vm.LastPost, opt => opt.MapFrom(model => model.MessagePosts.OrderByDescending(mp => mp.PostDate).FirstOrDefault()))
                .ForMember(vm => vm.CreatorName, opt => opt.MapFrom(model => model.Contact.FirstName + " " + model.Contact.LastName))
                .ForMember(vm => vm.CreateDate, opt => opt.MapFrom(model => model.TopicCreateDate))
                .ForMember(vm => vm.TopicTitle, opt => opt.MapFrom(model => model.Topic));

            Mapper.CreateMap<PhotoGalleryItem, PhotoViewModel>()
                .ForMember(vm => vm.ReferenceId, opt => opt.MapFrom(model => model.AccountId));

            Mapper.CreateMap<PhotoGalleryAlbum, PhotoAlbumViewModel>()
                .ForMember(vm => vm.PhotoCount, opt => opt.MapFrom(model => model.Photos.Count()));

            Mapper.CreateMap<AccountHandout, HandoutViewModel>()
                .ForMember(vm => vm.ReferenceId, opt => opt.MapFrom(model => model.AccountId));

            Mapper.CreateMap<TeamHandout, HandoutViewModel>()
                .ForMember(vm => vm.ReferenceId, opt => opt.MapFrom(model => model.TeamId));

            Mapper.CreateMap<HOFMember, HOFMemberViewModel>()
                .ForMember(vm => vm.Biography, opt => opt.MapFrom(model => model.Bio))
                .ForMember(vm => vm.Name, opt => opt.MapFrom(model => Contact.BuildFullName(model.Contact.FirstName, model.Contact.MiddleName, model.Contact.LastName)))
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetLargePhotoURL(model.ContactId)));

            Mapper.CreateMap<HOFClass, HOFClassViewModel>();

            Mapper.CreateMap<LeagueFAQItem, FAQItemViewModel>();

            Mapper.CreateMap<MemberBusiness, SponsorViewModel>()
                .ForMember(vm => vm.ContactName, opt => opt.MapFrom(model => model.Contact.FirstName + " " + model.Contact.LastName))
                .ForMember(vm => vm.ContactPhotoUrl, opt => opt.MapFrom(model => model.Contact.PhotoURL));

            Mapper.CreateMap<ProfileQuestionAnswer, ProfileAnswersViewModel>()
                .ForMember(vm => vm.LastName, opt => opt.MapFrom(model => model.Contact.LastName))
                .ForMember(vm => vm.FirstName, opt => opt.MapFrom(model => model.Contact.FirstName))
                .ForMember(vm => vm.MiddleName, opt => opt.MapFrom(model => model.Contact.MiddleName))
                .ForMember(vm => vm.PhotoUrl, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.Contact.Id)));

            Mapper.CreateMap<ProfileQuestionItem, ProfileQuestionViewModel>();

            Mapper.CreateMap<ProfileCategoryItem, ProfileCategoryViewModel>()
                .ForMember(vm => vm.Questions, opt => opt.MapFrom(model => model.ProfileQuestions.OrderBy(pq => pq.QuestionNum).ThenBy(pq => pq.Question)));

            Mapper.CreateMap<Season, SeasonViewModel>();
        }
    }
}
