using System;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using ModelObjects;
using SportsManager.Golf.ViewModels;
using SportsManager.Models;
using SportsManager.ViewModels;

namespace SportsManager.Areas.Golf.Controllers
{
    public class LeagueController : Controller
    {
        //
        // GET: /Golf/League/

        public ActionResult Index(long? accountId)
        {
            if (accountId.GetValueOrDefault(0) != 0)
            {
                return RedirectToAction("Home", new { accountId = accountId });
            }

            return View(new SportsManager.Golf.ViewModels.LeagueIndexViewModel());
        }

        public ActionResult Home(long accountId)
        {
            long seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            if (seasonId == 0)
                return RedirectToAction("Index", "Season", new { area = "", accountId = accountId });

            ViewData["SeasonId"] = seasonId;

            var vm = new SportsManager.Golf.ViewModels.LeagueHomeViewModel(this, accountId, seasonId);

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
            long newAccountId = 0;

            LeagueCreateAccountViewModel vm = new LeagueCreateAccountViewModel();

            bool updateModel = TryUpdateModel(vm);
            string userId = User.Identity.GetUserId();
            if (!String.IsNullOrEmpty(userId) && updateModel)
            {
                Account account = new Account();
                account.AccountName = vm.LeagueName;
                account.AccountURL = (String.IsNullOrWhiteSpace(vm.URL) ? String.Empty : vm.URL);
                account.TimeZoneId = vm.TimeZone;
                account.OwnerUserId = userId;
                account.AccountTypeId = (long)Account.AccountType.Golf;

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

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult LeagueSetup(long accountId)
        {
            GolfLeagueSetupViewModel vm = new GolfLeagueSetupViewModel(accountId);
            return View(vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [HttpPost]
        public ActionResult LeagueSetup(long accountId, FormCollection form)
        {
            GolfLeagueSetupViewModel vm = new GolfLeagueSetupViewModel(accountId);

            if (TryUpdateModel(vm))
            {
                SportsManager.Model.GolfLeagueSetup gls = vm.GetSetupFromViewModel(accountId);
                bool updateSuccess = DataAccess.Golf.GolfLeagues.UpdateGolfLeagueSetup(gls);
                if (updateSuccess)
                    return RedirectToAction("LeagueSetup");
            }

            return View(vm);
        }
    }
}
