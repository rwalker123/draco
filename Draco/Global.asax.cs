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

            Mapper.CreateMap<ContactRole, ContactNameRoleViewModel>()
                .ForMember(vm => vm.FirstName, opt => opt.MapFrom(model => model.Contact.FirstName))
                .ForMember(vm => vm.LastName, opt => opt.MapFrom(model => model.Contact.LastName))
                .ForMember(vm => vm.MiddleName, opt => opt.MapFrom(model => model.Contact.MiddleName))
                .ForMember(vm => vm.FirstYear, opt => opt.MapFrom(model => model.Contact.FirstYear))
                .ForMember(vm => vm.Zip, opt => opt.MapFrom(model => model.Contact.Zip))
                .ForMember(vm => vm.BirthDate, opt => opt.MapFrom(model => model.Contact.DateOfBirth))
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.ContactId)));

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
                .ForMember(vm => vm.Name, opt => opt.MapFrom(model => ContactViewModel.BuildFullName(model.Contact.FirstName, model.Contact.MiddleName, model.Contact.LastName)))
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetLargePhotoURL(model.ContactId)));

            Mapper.CreateMap<HOFClass, HOFClassViewModel>();

            Mapper.CreateMap<LeagueFAQItem, FAQItemViewModel>();

            Mapper.CreateMap<MemberBusiness, SponsorViewModel>()
                .ForMember(vm => vm.ContactName, opt => opt.MapFrom(model => model.Contact.FirstName + " " + model.Contact.LastName))
                .ForMember(vm => vm.ContactPhotoUrl, opt => opt.MapFrom(model => model.Contact.PhotoURL));

            Mapper.CreateMap<Sponsor, SponsorViewModel>()
                .ForMember(vm => vm.ContactName, opt => opt.MapFrom(model => model.Name))
                .ForMember(vm => vm.ContactPhotoUrl, opt => opt.MapFrom(model => model.LogoURL));

            Mapper.CreateMap<ProfileQuestionAnswer, ProfileAnswersViewModel>()
                .ForMember(vm => vm.LastName, opt => opt.MapFrom(model => model.Contact.LastName))
                .ForMember(vm => vm.FirstName, opt => opt.MapFrom(model => model.Contact.FirstName))
                .ForMember(vm => vm.MiddleName, opt => opt.MapFrom(model => model.Contact.MiddleName))
                .ForMember(vm => vm.PhotoUrl, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.Contact.Id)));

            Mapper.CreateMap<ProfileQuestionItem, ProfileQuestionViewModel>();

            Mapper.CreateMap<ProfileCategoryItem, ProfileCategoryViewModel>()
                .ForMember(vm => vm.Questions, opt => opt.MapFrom(model => model.ProfileQuestions.OrderBy(pq => pq.QuestionNum).ThenBy(pq => pq.Question)));

            Mapper.CreateMap<Season, SeasonViewModel>();

            Mapper.CreateMap<VoteQuestion, VoteQuestionViewModel>();

            Mapper.CreateMap<VoteOption, VoteOptionViewModel>();

            Mapper.CreateMap<VoteQuestion, VoteQuestionResultsViewModel>()
                .ForMember(vm => vm.HasVoted, opt => opt.MapFrom(model => model.VoteAnswers.Where(va => va.Contact.UserId == Globals.GetCurrentUserId()).Any()))
                .ForMember(vm => vm.OptionSelected, opt => opt.MapFrom(model => model.VoteAnswers.Where(va => va.Contact.UserId == Globals.GetCurrentUserId()).Select(va => va.OptionId).SingleOrDefault()))
                .ForMember(vm => vm.Results,
                           opt => opt.MapFrom(model => model.VoteAnswers.GroupBy(va => new
                           {
                               va.OptionId,
                               va.VoteOption.OptionText,
                               va.VoteOption.Priority
                           }).OrderBy(x => x.Key.Priority)
                              .Select(va => new VoteResultsViewModel()
                              {
                                  OptionId = va.Key.OptionId,
                                  OptionText = va.Key.OptionText,
                                  TotalVotes = va.Count()
                              })));

            Mapper.CreateMap<AccountWelcome, WelcomeTextViewModel>();
            Mapper.CreateMap<AccountWelcome, WelcomeHeaderViewModel>();

            Mapper.CreateMap<Player, ContactNameViewModel>()
                .ForMember(vm => vm.Id, opt => opt.MapFrom(model => model.ContactId))
                .ForMember(vm => vm.FirstName, opt => opt.MapFrom(model => model.Contact.FirstName))
                .ForMember(vm => vm.LastName, opt => opt.MapFrom(model => model.Contact.LastName))
                .ForMember(vm => vm.MiddleName, opt => opt.MapFrom(model => model.Contact.MiddleName))
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.ContactId)))
                .ForMember(vm => vm.FirstYear, opt => opt.MapFrom(model => model.Contact.FirstYear))
                .ForMember(vm => vm.Zip, opt => opt.MapFrom(model => model.Contact.DateOfBirth));

            Mapper.CreateMap<PlayerSeason, ContactNameViewModel>()
                .ForMember(vm => vm.Id, opt => opt.MapFrom(model => model.Roster.ContactId))
                .ForMember(vm => vm.FirstName, opt => opt.MapFrom(model => model.Roster.Contact.FirstName))
                .ForMember(vm => vm.LastName, opt => opt.MapFrom(model => model.Roster.Contact.LastName))
                .ForMember(vm => vm.MiddleName, opt => opt.MapFrom(model => model.Roster.Contact.MiddleName))
                .ForMember(vm => vm.PhotoURL, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.Roster.ContactId)))
                .ForMember(vm => vm.FirstYear, opt => opt.MapFrom(model => model.Roster.Contact.FirstYear))
                .ForMember(vm => vm.Zip, opt => opt.MapFrom(model => model.Roster.Contact.DateOfBirth));

            Mapper.CreateMap<Field, FieldViewModel>();

            Mapper.CreateMap<PlayersWantedClassified, PlayersWantedViewModel>()
                .ForMember(vm => vm.EMail, opt => opt.MapFrom(model => model.Contact.Email))
                .ForMember(vm => vm.Phone, opt => opt.MapFrom(model => model.Contact.Phone1))
                .ForMember(vm => vm.CreatedByName, opt => opt.MapFrom(model => ContactViewModel.BuildFullName(model.Contact.FirstName, model.Contact.MiddleName, model.Contact.LastName)))
                .ForMember(vm => vm.CreatedByPhotoUrl, opt => opt.MapFrom(model => Contact.GetPhotoURL(model.Contact.Id)));

            Mapper.CreateMap<TeamsWantedClassified, TeamWantedViewModel>();

            Mapper.CreateMap<PlayerSeason, PlayerViewModel>()
                .ForMember(vm => vm.AccountId, opt => opt.MapFrom(model => model.Roster.AccountId))
                .ForMember(vm => vm.TeamId, opt => opt.MapFrom(model => model.TeamSeasonId))
                .ForMember(vm => vm.SubmittedDriversLicense, opt => opt.MapFrom(model => model.Roster.SubmittedDriversLicense))
                .ForMember(vm => vm.AffiliationDuesPaid, opt => opt.MapFrom(model => model.Roster.PlayerSeasonAffiliationDues.Where(psa => psa.SeasonId == model.TeamSeason.LeagueSeason.SeasonId).Select(psa => psa.AffiliationDuesPaid)))
                .ForMember(vm => vm.Contact, opt => opt.MapFrom(model => model.Roster.Contact));

            Mapper.CreateMap<AccountSetting, AccountSettingViewModel>();

            Mapper.CreateMap<Game, GameViewModel>()
                .ForMember(vm => vm.HomeTeamId, opt => opt.MapFrom(model => model.HTeamId))
                .ForMember(vm => vm.AwayTeamId, opt => opt.MapFrom(model => model.VTeamId))
                .ForMember(vm => vm.HomeScore, opt => opt.MapFrom(model => model.HScore))
                .ForMember(vm => vm.AwayScore, opt => opt.MapFrom(model => model.VScore))
                .ForMember(vm => vm.HomeTeamName, opt => opt.MapFrom(model => model.LeagueSeason.TeamsSeasons.Where(ts => ts.Id == model.HTeamId).Select(ts => ts.Name).SingleOrDefault()))
                .ForMember(vm => vm.AwayTeamName, opt => opt.MapFrom(model => model.LeagueSeason.TeamsSeasons.Where(ts => ts.Id == model.VTeamId).Select(ts => ts.Name).SingleOrDefault()))
                .ForMember(vm => vm.FieldName, opt => opt.MapFrom(model => model.AvailableField.Name))
                .ForMember(vm => vm.HasGameRecap, opt => opt.MapFrom(model => model.GameRecaps.Any()));

            Mapper.CreateMap<WorkoutAnnouncement, WorkoutAnnouncementViewModel>()
                .Include<WorkoutAnnouncement, WorkoutAnnouncementRegisteredViewModel>()
                .ForMember(vm => vm.Description, opt => opt.MapFrom(model => model.WorkoutDesc))
                .ForMember(vm => vm.WorkoutLocation, opt => opt.MapFrom(model => model.FieldId));

            Mapper.CreateMap<WorkoutAnnouncement, WorkoutAnnouncementRegisteredViewModel>()
                .ForMember(vm => vm.NumRegistered, opt => opt.MapFrom(model => model.WorkoutRegistrations.Count()))
                .ForMember(vm => vm.FieldName, opt => opt.MapFrom(model => model.AvailableField.Name));

            Mapper.CreateMap<WorkoutRegistrant, WorkoutRegistrantViewModel>()
                .ForMember(vm => vm.Email, opt => opt.MapFrom(model => model.EMail))
                .ForMember(vm => vm.WantToManage, opt => opt.MapFrom(model => model.IsManager));

            Mapper.CreateMap<Umpire, UmpireViewModel>()
                .ForMember(vm => vm.Contact, opt => opt.MapFrom(model => model.Contact));

            Mapper.CreateMap<GameBatStats, BatStatsViewModel>()
                .ForMember(vm => vm.AB, opt => opt.MapFrom(model => model.Ab))
                .ForMember(vm => vm.D, opt => opt.MapFrom(model => model.C2B))
                .ForMember(vm => vm.T, opt => opt.MapFrom(model => model.C3B))
                .ForMember(vm => vm.HR, opt => opt.MapFrom(model => model.Hr))
                .ForMember(vm => vm.RBI, opt => opt.MapFrom(model => model.Rbi))
                .ForMember(vm => vm.SO, opt => opt.MapFrom(model => model.So))
                .ForMember(vm => vm.BB, opt => opt.MapFrom(model => model.Bb))
                .ForMember(vm => vm.RE, opt => opt.MapFrom(model => model.Re))
                .ForMember(vm => vm.HBP, opt => opt.MapFrom(model => model.Hbp))
                .ForMember(vm => vm.INTR, opt => opt.MapFrom(model => model.Intr))
                .ForMember(vm => vm.SF, opt => opt.MapFrom(model => model.Sf))
                .ForMember(vm => vm.SH, opt => opt.MapFrom(model => model.Sh))
                .ForMember(vm => vm.SB, opt => opt.MapFrom(model => model.Sb))
                .ForMember(vm => vm.CS, opt => opt.MapFrom(model => model.Cs))
                .ForMember(vm => vm.LOB, opt => opt.MapFrom(model => model.Lob))
                .ForMember(vm => vm.TB, opt => opt.MapFrom(model => model.Tb))
                .ForMember(vm => vm.PA, opt => opt.MapFrom(model => model.Pa))
                .ForMember(vm => vm.AVG, opt => opt.MapFrom(model => model.Avg))
                .ForMember(vm => vm.PlayerName, opt => opt.MapFrom(model => ContactViewModel.BuildFullName(model.RosterSeason.Roster.Contact.FirstName, model.RosterSeason.Roster.Contact.MiddleName, model.RosterSeason.Roster.Contact.LastName)));

            Mapper.CreateMap<GamePitchStats, PitchStatsViewModel>()
                .ForMember(vm => vm.IP, opt => opt.MapFrom(model => model.Ip))
                .ForMember(vm => vm.IP2, opt => opt.MapFrom(model => model.Ip2))
                .ForMember(vm => vm.BF, opt => opt.MapFrom(model => model.Bf))
                .ForMember(vm => vm.ER, opt => opt.MapFrom(model => model.Er))
                .ForMember(vm => vm.D, opt => opt.MapFrom(model => model.C2B))
                .ForMember(vm => vm.T, opt => opt.MapFrom(model => model.C3B))
                .ForMember(vm => vm.HR, opt => opt.MapFrom(model => model.Hr))
                .ForMember(vm => vm.SO, opt => opt.MapFrom(model => model.So))
                .ForMember(vm => vm.BB, opt => opt.MapFrom(model => model.Bb))
                .ForMember(vm => vm.WP, opt => opt.MapFrom(model => model.Wp))
                .ForMember(vm => vm.HBP, opt => opt.MapFrom(model => model.Hbp))
                .ForMember(vm => vm.BK, opt => opt.MapFrom(model => model.Bk))
                .ForMember(vm => vm.SC, opt => opt.MapFrom(model => model.Sc))
                .ForMember(vm => vm.TB, opt => opt.MapFrom(model => model.Tb))
                .ForMember(vm => vm.AB, opt => opt.MapFrom(model => model.Ab))
                .ForMember(vm => vm.PlayerName, opt => opt.MapFrom(model => ContactViewModel.BuildFullName(model.RosterSeason.Roster.Contact.FirstName, model.RosterSeason.Roster.Contact.MiddleName, model.RosterSeason.Roster.Contact.LastName)));

            Mapper.CreateMap<GameRecap, GameRecapViewModel>();

            Mapper.CreateMap<PlayoffBracket, PlayoffBracketViewModel>();
            Mapper.CreateMap<PlayoffGame, PlayoffGameViewModel>();
            Mapper.CreateMap<PlayoffSeed, PlayoffSeedViewModel>();

            Mapper.AssertConfigurationIsValid();
        }
    }
}
