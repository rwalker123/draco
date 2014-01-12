using System;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Models;
using SportsManager.ViewModels;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueController : Controller
    {
        //
        // GET: /Baseball/League/

        public ActionResult Index(long? accountId)
        {
            long aId = accountId.GetValueOrDefault(0);
            if (aId != 0)
            {
                return RedirectToAction("Home");
            }

            return View(new SportsManager.Baseball.ViewModels.LeagueIndexViewModel());
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
                return View(new SportsManager.Baseball.ViewModels.LeagueIndexViewModel());
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

            if (!String.IsNullOrEmpty(userId) && updateModel)
            {
                Account account = new Account();
                account.AccountName = vm.LeagueName;
                account.AccountURL = (String.IsNullOrWhiteSpace(vm.URL) ? String.Empty : vm.URL);
                account.TimeZoneId = vm.TimeZone;
                account.OwnerUserId = User.Identity.GetUserId();
                account.AccountTypeId = (long)Account.AccountType.Baseball;

                newAccountId = DataAccess.Accounts.AddAccount(account);
            }

            // returns the new accountId if 0, something failed.
            if (newAccountId == 0)
            {
                ViewData["TimeZones"] = vm.TimeZones;
                return View(vm);
            }
            else
            {
                return RedirectToAction("Home", new { accountId = newAccountId });
            }
        }
    }
}
