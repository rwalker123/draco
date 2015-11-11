using System.Web.Mvc;

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
