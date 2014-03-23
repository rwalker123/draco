using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Baseball.ViewModels;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class LeagueScheduleController : Controller
	{
		//
		// GET: /Baseball/LeagueSchedule/
		public ActionResult Index(long? accountId, long? seasonId)
		{
			long aId = accountId.GetValueOrDefault(0);
			if (aId == 0)
				return RedirectToAction("Index", "Baseball");

			long sId = seasonId.GetValueOrDefault(0);
			if (sId == 0)
				sId = DataAccess.Seasons.GetCurrentSeason(aId);

			return View("ScheduleMain", new ScheduleViewModel(this, aId, sId));
		}

	}
}
