using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class MemberBusinessController : DBController
	{
        public MemberBusinessController(DB db) : base(db)
        {
        }

		//
		// GET: /Baseball/MemberBusiness/

		public ActionResult Index(long? accountId)
		{
			if (accountId.GetValueOrDefault(0) == 0)
			{
				return RedirectToAction("Index", "League");
			}


			return View(new MemberBusinessViewModel(this, accountId.Value));
		}

	}
}
