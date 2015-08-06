using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels;
using System;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
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
            long newAccountId = 0;

            LeagueCreateAccountViewModel vm = new LeagueCreateAccountViewModel();

            string userId = User.Identity.GetUserId();
            bool updateModel = TryUpdateModel(vm);

            System.Diagnostics.Debug.Assert(false, "Create a contact and use that for OwnerUserId below");
            if (!String.IsNullOrEmpty(userId) && updateModel)
            {
                Account account = new Account();
                account.Name = vm.LeagueName;
                account.Url = (String.IsNullOrWhiteSpace(vm.URL) ? String.Empty : vm.URL);
                account.TimeZoneId = vm.TimeZone;
                //account.OwnerUserId = User.Identity.GetUserId();
                account.AccountTypeId = 1; // baseball

                Db.Accounts.Add(account);
                Db.SaveChanges();

                ViewData["TimeZones"] = vm.TimeZones;
                return View(vm);
            }

            return RedirectToAction("Home", new { accountId = newAccountId });
        }
    }
}
