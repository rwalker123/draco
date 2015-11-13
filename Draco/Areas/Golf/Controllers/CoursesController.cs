using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Golf.ViewModels;
using SportsManager.Models;
using SportsManager.Controllers;
using ModelObjects;
using SportsManager.Golf;

namespace SportsManager.Areas.Golf.Controllers
{
	public class CoursesController : DBController
	{
        public CoursesController(DB db) : base(db)
        {
        }

		//
		// GET: /Golf/Courses/

		public ActionResult Index(long accountId)
		{
			return View(new GolfCoursesViewModel(this, accountId));
		}

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId)
		{
			ViewData["Title"] = "Create";

			SetValidNumberOfHolesViewData();
            Globals.SetupAccountViewData(accountId, this.ViewData);

			return View(new GolfCourseViewModel());
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[HttpPost]
		public ActionResult Create(long accountId, FormCollection collection)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel();

			if (TryUpdateModel(vm))
			{
				GolfCourse gc = GetCourseFromViewModel(vm);
                Db.GolfCourses.Add(gc);

                GolfLeagueCourse glc = new GolfLeagueCourse()
                {
                    AccountId = accountId,
                    GolfCourse = gc
				};

                Db.GolfLeagueCourses.Add(glc);
                Db.SaveChanges();

                return RedirectToAction("Index", new { accountId = accountId });
			}

			ViewData["Title"] = "Create";

			SetValidNumberOfHolesViewData();
            Globals.SetupAccountViewData(accountId, this.ViewData);

            return View(vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id)
		{
			ViewData["Title"] = "Edit";

			SetValidNumberOfHolesViewData();

            Globals.SetupAccountViewData(accountId, this.ViewData);

            GolfCourse gc = Db.GolfCourses.Find(id);
			return View("Create", GolfCourseViewModel.GetCourseViewModel(gc));
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[HttpPost]
		public ActionResult Edit(long accountId, long id, FormCollection collection)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel()
			{
				CourseId = id
			};

			if (TryUpdateModel(vm))
			{
				GolfCourse gc = GetCourseFromViewModel(vm);
				ModifyGolfCourse(gc);
				return RedirectToAction("Index", new { accountId = accountId });
			}

			ViewData["Title"] = "Edit";

			SetValidNumberOfHolesViewData();

            Globals.SetupAccountViewData(accountId, this.ViewData);

            return View("Create", vm);
		}


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Delete(long accountId, long id)
        {
            var golfCourse = Db.GolfCourses.Find(id);
            if (golfCourse != null)
            {
                Db.GolfCourses.Remove(golfCourse);
                Db.SaveChanges();
            }

            if (Request.IsAjaxRequest())
            {
                return Json(id);
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
        private void ModifyGolfCourse(GolfCourse course)
        {
            GolfCourse dbCourse = Db.GolfCourses.Find(course.Id);

            dbCourse.Name = course.Name;
            dbCourse.Address = course.Address;
            dbCourse.City = course.City;
            dbCourse.State = course.State;
            dbCourse.Zip = dbCourse.Zip;
            dbCourse.Designer = course.Designer;
            dbCourse.Country = dbCourse.Country;
            dbCourse.YearBuilt = dbCourse.YearBuilt;
            dbCourse.NumberOfHoles = course.NumberOfHoles;

            Db.SaveChanges();
        }

        private GolfCourse GetCourseFromViewModel(GolfCourseViewModel vm)
        {
            return new GolfCourse()
            {
                Id = vm.CourseId,
                Name = vm.Name,
                NumberOfHoles = vm.NumberOfHoles,
            };

        }

    }
}
