using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Golf.ViewModels;
using SportsManager.Model;
using SportsManager.Models;

namespace SportsManager.Areas.Golf.Controllers
{
	public class CourseTeeController : Controller
	{
		//
		// GET: /Golf/CourseTee/

		public ActionResult Index(long accountId, long id)
		{
			// no index page for tees, shown with courses on course page.
			return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public JsonResult GetTees(long accountId, long id)
		{
			IEnumerable<GolfTeeInformation> tees = DataAccess.Golf.TeeInformation.GetTeesIdAndNameForCourse(id);

			// convert to TeamViewModel
			var jsonData = (from t in tees
							select new
							{
								value = t.Id,
								name = t.TeeColor
							});

			return Json(jsonData, JsonRequestBehavior.AllowGet);
		}

		//
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id)
		{
			ViewData["Title"] = "Create Tee";

			return View(new GolfTeeViewModel(id));
		}

		//
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id, FormCollection collection)
		{
			GolfTeeViewModel vm = new GolfTeeViewModel(id);

			if (TryUpdateModel(vm))
			{
				long teeId = DataAccess.Golf.TeeInformation.AddTee(GolfTeeViewModel.GetCourseTeeFromViewModel(vm));
				if (teeId > 0)
					return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
			}

			ViewData["Title"] = "Create Tee";

			return View(vm);
		}

		//
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id)
		{
			ViewData["Title"] = "Edit Tee";

			return View("Create", GolfTeeViewModel.GetCourseTeeViewModel(DataAccess.Golf.TeeInformation.GetTeeInformation(id)));
		}

		//
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id, FormCollection collection)
		{
			GolfTeeViewModel vm = new GolfTeeViewModel(0)
			{
				TeeId = id
			};

			if (TryUpdateModel(vm))
			{
				bool modifySuccess = DataAccess.Golf.TeeInformation.ModifyTee(GolfTeeViewModel.GetCourseTeeFromViewModel(vm));
				if (modifySuccess)
					return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
			}

			ViewData["Title"] = "Edit Tee";

			return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long id)
		{
			bool success = DataAccess.Golf.TeeInformation.RemoveTee(id);

			if (Request.IsAjaxRequest())
			{
				return Json(success);
			}
			else
			{
				return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
			}
		}
	}
}
