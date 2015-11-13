using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.Golf.ViewModels;
using SportsManager.Models;
using SportsManager.ViewModels;
using System;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
{
    public class LeagueController : DBController
    {
        public LeagueController(DB db) : base(db)
        {
        }

        //
        // GET: /Golf/League/

        public ActionResult Index(long? accountId)
        {
            if (accountId.GetValueOrDefault(0) != 0)
            {
                return RedirectToAction("Home", new { accountId = accountId });
            }

            return View(new LeagueIndexViewModel(this));
        }

        public ActionResult Home(long accountId)
        {
            long seasonId = this.GetCurrentSeasonId(accountId);
            if (seasonId == 0)
                return RedirectToAction("Index", "Season", new { area = "", accountId = accountId });

            ViewData["SeasonId"] = seasonId;

            var vm = new LeagueHomeViewModel(this, accountId, seasonId);

            ViewBag.IsMobile = MobileHelpers.IsMobileDevice(Request);

            return View(vm);
        }

        // must be logged in to create an account.
        [Authorize]
        public ActionResult CreateAccount()
        {
            var vm = new LeagueCreateAccountViewModel();
            ViewData["TimeZones"] = vm.TimeZones;

            return View(vm);
        }

        [HttpPost, Authorize]
        public ActionResult CreateAccount(FormCollection formData)
        {
            LeagueCreateAccountViewModel vm = new LeagueCreateAccountViewModel();

            string userId = User.Identity.GetUserId();
            bool updateModel = TryUpdateModel(vm);

            if (!String.IsNullOrEmpty(userId) && updateModel)
            {
                Account account = new Account()
                {
                    Name = vm.LeagueName,
                    TimeZoneId = vm.TimeZone,
                    OwnerUserId = userId,
                    AccountTypeId = (long)Account.eAccountType.Golf,
                    AffiliationId = 0,
                    TwitterOauthToken = String.Empty,
                    TwitterOauthSecretKey = String.Empty,
                    TwitterAccountName = String.Empty,
                    TwitterWidgetScript = String.Empty,
                    YouTubeUserId = String.Empty,
                    FacebookFanPage = String.Empty,
                    DefaultVideo = String.Empty,
                    AutoPlayVideo = false,
                    FirstYear = DateTime.Now.Year
                };

                Db.Accounts.Add(account);

                if (!String.IsNullOrEmpty(vm.URL))
                {
                    var aUrl = new AccountURL()
                    {
                        Id = 0,
                        URL = vm.URL,
                        Account = account
                    };
                    Db.AccountsURL.Add(aUrl);
                }

                Db.SaveChanges();

                // create a contact for the owner.
                Contact c = new Contact()
                {
                    Email = User.Identity.GetUserName(),
                    FirstName = vm.FirstName,
                    LastName = vm.LastName,
                    MiddleName = String.Empty,
                    CreatorAccountId = account.Id,
                    UserId = userId,
                    Phone1 = String.Empty,
                    Phone2 = String.Empty,
                    Phone3 = String.Empty,
                    StreetAddress = String.Empty,
                    City = String.Empty,
                    State = String.Empty,
                    Zip = String.Empty,
                    DateOfBirth = vm.DateOfBirth,
                    IsFemale = false

                };

                Db.Contacts.Add(c);
                Db.SaveChanges();

                ViewData["TimeZones"] = vm.TimeZones;
                return RedirectToAction("Home", new { accountId = account.Id });
            }

            return View(vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult LeagueSetup(long accountId)
        {
            GolfLeagueSetupViewModel vm = new GolfLeagueSetupViewModel(this, accountId);
            return View(vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [HttpPost]
        public ActionResult LeagueSetup(long accountId, FormCollection form)
        {
            GolfLeagueSetupViewModel vm = new GolfLeagueSetupViewModel(this, accountId);

            if (TryUpdateModel(vm))
            {
                GolfLeagueSetup gls = vm.GetSetupFromViewModel(accountId);
                bool updateSuccess = UpdateGolfLeagueSetup(gls);
                if (updateSuccess)
                    return RedirectToAction("LeagueSetup");
            }

            return View(vm);
        }

        private bool UpdateGolfLeagueSetup(GolfLeagueSetup gls)
        {
            if (gls.AccountId <= 0)
                return false;

            DB db = this.Db;

            var curGls = (from a in db.GolfLeagueSetups
                          where a.AccountId == gls.AccountId
                          select a).SingleOrDefault();

            if (curGls == null)
            {
                db.GolfLeagueSetups.Add(gls);
                db.SaveChanges();
            }
            else
            {
                curGls.FirstTeeTime = gls.FirstTeeTime;
                curGls.HolesPerMatch = gls.HolesPerMatch;
                curGls.TimeBetweenTeeTimes = gls.TimeBetweenTeeTimes;
                curGls.LeagueDay = gls.LeagueDay;
                db.SaveChanges();
            }

            return true;
        }

    }
}
