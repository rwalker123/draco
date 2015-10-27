using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class FieldsController : DBController
	{
        public FieldsController(DB db) : base(db)
        {

        }

		//
		// GET: /Baseball/Fields/{lid}

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
