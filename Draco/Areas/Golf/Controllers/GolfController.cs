using System.Web.Mvc;
using SportsManager.ViewModels;

namespace SportsManager.Areas.Golf.Controllers
{
	public class GolfController : Controller
	{
		//
		// GET: /Golf/Golf/

		public ActionResult Index()
		{
			return View("GolfHome");
		}
	}
}
