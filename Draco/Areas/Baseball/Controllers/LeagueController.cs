using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Baseball.ViewModels.Controllers;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels;
using System;
using System.Web.Mvc;

namespace SportsManager.Baseball.Controllers
{
    public class LeagueController : DBController
    {
        public LeagueController(DB db) : base(db)
        {
        }

        //
        // GET: /Baseball/League/
        public ActionResult Index(long? accountId)
        {
            long aId = accountId.GetValueOrDefault(0);
            if (aId != 0)
            {
                return RedirectToAction("Home", new { accountId = aId });
            }

            return View(new LeagueIndexViewModel(this));
        }

        [HttpPost]
        public ActionResult Index(FormCollection collection)
        {
            try
            {
                return RedirectToAction("Home", new { accountId = long.Parse(collection["accountId"]) });
            }
            catch
            {
                return View(new LeagueIndexViewModel(this));
            }
        }

        public ActionResult Home(long? accountId)
        {
            long aId = accountId.GetValueOrDefault(0);
            if (aId == 0)
            {
                return RedirectToAction("Index");
            }

            LeagueHomeViewModel vm = new LeagueHomeViewModel(this, aId);
            return View(vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Settings(long accountId)
        {
            SettingsViewModel vm = new SettingsViewModel(this, accountId);
            return View("SettingsView", vm);
        }

        //
        // GET: /Baseball/League/Details/5

        public ActionResult Details(long lid)
        {
            return View();
        }

        //
        // GET: /Baseball/League/Create
        [Authorize]
        public ActionResult CreateAccount()
        {
            var vm = new LeagueCreateAccountViewModel();
            ViewData["TimeZones"] = vm.TimeZones;

            return View(vm);
        }

        //
        // POST: /Baseball/League/Create

        [HttpPost, Authorize]
        public ActionResult CreateAccount(FormCollection collection)
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
                    AccountTypeId = (long)Account.eAccountType.Baseball,
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
    }
}
