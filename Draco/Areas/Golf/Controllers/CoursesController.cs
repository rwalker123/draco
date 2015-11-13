using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.Golf.ViewModels.Controllers;
using SportsManager.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
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
		public ActionResult Create(long accountId, GolfCourseViewModel vm)
		{
			if (ModelState.IsValid)
			{
                if (vm.MensPar.Count >= vm.NumberOfHoles &&
                    vm.MensHandicap.Count >= vm.NumberOfHoles &&
                    vm.WomensPar.Count >= vm.NumberOfHoles &&
                    vm.WomensHandicap.Count >= vm.NumberOfHoles)
                {
                    GolfCourse gc = CreateCourseFromViewModel(vm);
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
            var vm = Mapper.Map<GolfCourse, GolfCourseViewModel>(gc);
			return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[HttpPost]
		public ActionResult Edit(long accountId, long id, GolfCourseViewModel vm)
		{
            if (ModelState.IsValid)
            {
                var gc = Db.GolfCourses.Find(id);
                if (gc != null)
                {
                    if (vm.MensPar.Count >= vm.NumberOfHoles &&
                        vm.MensHandicap.Count >= vm.NumberOfHoles &&
                        vm.WomensPar.Count >= vm.NumberOfHoles &&
                        vm.WomensHandicap.Count >= vm.NumberOfHoles)
                    {
                        if (vm.NumberOfHoles != gc.NumberOfHoles)
                        {
                            bool remove = vm.NumberOfHoles < gc.NumberOfHoles;
                            int increment = remove ? -1 : 1;
                            for (int i = gc.NumberOfHoles; i != vm.NumberOfHoles; i += increment)
                            {
                                if (remove)
                                {
                                    Db.GolfCourseMenPars.Remove(gc.MensPars[i - 1]);
                                    Db.GolfCourseWomenPars.Remove(gc.WomensPars[i - 1]);
                                }
                                else
                                {
                                    gc.MensPars.Add(new GolfCourseMenPar()
                                    {
                                        Course = gc,
                                        HoleNo = i + 1,
                                        Par = 0,
                                        Handicap = 0
                                    });
                                    gc.WomensPars.Add(new GolfCourseWomenPar()
                                    {
                                        Course = gc,
                                        HoleNo = i + 1,
                                        Par = 0,
                                        Handicap = 0
                                    });
                                }
                            }
                        }

                        gc.Name = vm.Name;
                        gc.Address = vm.Address;
                        gc.City = vm.City;
                        gc.State = vm.State;
                        gc.Zip = vm.Zip;
                        gc.Designer = vm.Designer;
                        gc.NumberOfHoles = vm.NumberOfHoles;

                        vm.MensPar.Zip(gc.MensPars, (first, second) =>
                        {
                            second.Par = first;
                            return second;
                        }).ToList();

                        vm.MensHandicap.Zip(gc.MensPars, (first, second) =>
                        {
                            second.Handicap = first;
                            return second;
                        }).ToList();

                        vm.WomensPar.Zip(gc.WomensPars, (first, second) =>
                        {
                            second.Par = first;
                            return second;
                        }).ToList();

                        vm.WomensHandicap.Zip(gc.WomensPars, (first, second) =>
                        {
                            second.Handicap = first;
                            return second;
                        }).ToList();

                        Db.SaveChanges();

                        return RedirectToAction("Index", new { accountId = accountId });
                    }
                }
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
        private GolfCourse CreateCourseFromViewModel(GolfCourseViewModel vm)
        {
            var gc = new GolfCourse()
            {
                Id = vm.CourseId,
                Name = vm.Name,
                NumberOfHoles = vm.NumberOfHoles
            };


            for (int holeNo = 1; holeNo <= vm.NumberOfHoles; ++holeNo)
            {
                gc.MensPars.Add(new GolfCourseMenPar()
                {
                    Course = gc,
                    Par = vm.MensPar[holeNo-1],
                    Handicap = vm.MensHandicap[holeNo-1],
                    HoleNo = holeNo
                });

                gc.WomensPars.Add(new GolfCourseWomenPar()
                {
                    Course = gc,
                    Par = vm.WomensPar[holeNo - 1],
                    Handicap = vm.WomensHandicap[holeNo - 1],
                    HoleNo = holeNo
                });
            }

            return gc;
        }
    }
}
