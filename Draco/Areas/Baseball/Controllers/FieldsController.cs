using System.Collections.Generic;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Models;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class FieldsController : Controller
	{
		//
		// GET: /Baseball/Fields/{lid}

		// disable cache so that ajax call can be made.
		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult Index(long? accountId, long? id = null)
		{
			if (accountId.GetValueOrDefault(0) == 0)
			{
				return RedirectToAction("Index", "League");
			}

            if (id.HasValue)
                ViewBag.SelectedField = id.Value;
            else
                ViewBag.SelectedField = 0;

			return View("Fields", new LeagueFieldsViewModel(this, accountId.Value));
		}
	}
}
