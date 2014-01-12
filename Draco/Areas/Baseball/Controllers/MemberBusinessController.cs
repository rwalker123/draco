using System.Web.Mvc;
using SportsManager.Baseball.ViewModels;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class MemberBusinessController : Controller
	{
		//
		// GET: /Baseball/MemberBusiness/

		public ActionResult Index(long? accountId)
		{
			if (accountId.GetValueOrDefault(0) == 0)
			{
				return RedirectToAction("Index", "League");
			}


			return View(new MemberBusinessViewModel(accountId.Value));
		}

	}
}
