using System.Collections.Generic;
using System.Web.Mvc;
using SportsManager.Golf.ViewModels;
using SportsManager.Model;
using SportsManager.Models;

namespace SportsManager.Areas.Golf.Controllers
{
	public class CoursesController : Controller
	{
		//
		// GET: /Golf/Courses/

		public ActionResult Index(long accountId)
		{
			List<GolfCourseViewModel> coursesVM = new List<GolfCourseViewModel>();

			IEnumerable<GolfCourse> courses = DataAccess.Golf.GolfCourses.GetLeagueCourses(accountId);
			foreach (GolfCourse course in courses)
			{
				GolfCourseViewModel gcvm = GolfCourseViewModel.GetCourseViewModel(accountId, course);
				coursesVM.Add(gcvm);

				gcvm.AddTees();
			}

			return View(coursesVM);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId)
		{
			ViewData["Title"] = "Create";

			SetValidNumberOfHolesViewData();

			return View(new GolfCourseViewModel(accountId));
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[HttpPost]
		public ActionResult Create(long accountId, FormCollection collection)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel(accountId);

			if (TryUpdateModel(vm))
			{
				GolfCourse gc = GolfCourseViewModel.GetCourseFromViewModel(vm);
				long courseId = DataAccess.Golf.GolfCourses.AddGolfCourse(gc);

				if (courseId > 0)
				{
					GolfLeagueCourse glc = new GolfLeagueCourse()
					{
						AccountId = accountId,
						CourseId = courseId
					};

					DataAccess.Golf.GolfCourses.AddGolfLeagueCourse(glc);

					return RedirectToAction("Index", new { accountId = accountId });
				}
			}

			ViewData["Title"] = "Create";

			SetValidNumberOfHolesViewData();

			return View(new GolfCourseViewModel(accountId));
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id)
		{
			ViewData["Title"] = "Edit";

			SetValidNumberOfHolesViewData();

			GolfCourse gc = DataAccess.Golf.GolfCourses.GetCourse(id);

			return View("Create", GolfCourseViewModel.GetCourseViewModel(accountId, gc));
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[HttpPost]
		public ActionResult Edit(long accountId, long id, FormCollection collection)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel(accountId)
			{
				CourseId = id
			};

			if (TryUpdateModel(vm))
			{
				GolfCourse gc = GolfCourseViewModel.GetCourseFromViewModel(vm);
				bool modifySuccess = DataAccess.Golf.GolfCourses.ModifyGolfCourse(gc);

				if (modifySuccess)
					return RedirectToAction("Index", new { accountId = accountId });
			}

			ViewData["Title"] = "Edit";

			SetValidNumberOfHolesViewData();

			return View("Create", vm);
		}


		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long id)
		{
			bool success = DataAccess.Golf.GolfCourses.RemoveGolfCourse(id);

			if (Request.IsAjaxRequest())
			{
				return Json(success);
			}
			else
			{
				return RedirectToAction("Index", new { accountId = accountId });
			}
		}

		private void SetValidNumberOfHolesViewData()
		{
			List<SelectListItem> validNumberOfHoles = new List<SelectListItem>(2)
			{
				new SelectListItem()
				{
					Text = "18",
					Value = "18"
				},
				new SelectListItem()
				{
					Text = "9",
					Value = "9"
				}
			};

			ViewData["ValidNumberOfHoles"] = validNumberOfHoles;
		}
	}
}
