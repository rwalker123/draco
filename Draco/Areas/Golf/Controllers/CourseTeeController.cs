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
    public class CourseTeeController : DBController
	{
        public CourseTeeController(DB db) : base(db)
        {
        }

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
			IEnumerable<GolfTeeInformation> tees = GetTeesIdAndNameForCourse(id);

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

            Globals.SetupAccountViewData(accountId, this.ViewData);

            return View(new GolfTeeViewModel()
            {
                CourseId = id
            });
		}

		//
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id, GolfTeeViewModel vm)
		{
			if (ModelState.IsValid)
			{
                GolfTeeInformation teeInfo = new GolfTeeInformation()
                {
                    Id = 0,
                    CourseId = id,
                    TeeColor = vm.TeeColor,
                    TeeName = string.Empty,
                };

                teeInfo.MenSlopeRatings.Add(new GolfTeeMenSlopeRating()
                {
                    Tee = teeInfo,
                    NineHoleIndex = 0,
                    Rating = vm.MensRating,
                    Slope = vm.MensSlope
                });

                teeInfo.WomenSlopeRatings.Add(new GolfTeeWomenSlopeRating()
                {
                    Tee = teeInfo,
                    NineHoleIndex = 0,
                    Rating = vm.WomensRating,
                    Slope = vm.WomensSlope
                });

                int holeNo = 0;
                foreach (var hd in vm.HoleDistances)
                {
                    teeInfo.HoleDistances.Add(new GolfTeeHoleDistance()
                    {
                        Distance = hd,
                        HoleNo = ++holeNo,
                        Tee = teeInfo
                    });
                }


                Db.GolfTeeInformations.Add(teeInfo);
                Db.SaveChanges();

                if (teeInfo.Id > 0)
					return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
			}

			ViewData["Title"] = "Create Tee";
            Globals.SetupAccountViewData(accountId, this.ViewData);

            return View(vm);
		}

		//
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id)
		{
			ViewData["Title"] = "Edit Tee";

            Globals.SetupAccountViewData(accountId, this.ViewData);

            var gt = Db.GolfTeeInformations.Find(id);
            var vm = Mapper.Map<GolfTeeInformation, GolfTeeViewModel>(gt);
			return View("Create", vm);
		}

		//
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long id, GolfTeeViewModel vm)
		{
			if (ModelState.IsValid)
			{
                GolfTeeInformation dbTee = Db.GolfTeeInformations.Find(id); 
                if (dbTee != null)
                {
                    dbTee.TeeColor = vm.TeeColor;

                    dbTee.MenSlopeRatings[0].Rating = vm.MensRating;
                    //dbTee.MenSlopeRatings[1].Rating = vm.MensRatingFront9;
                    //dbTee.MenSlopeRatings[2].Rating = vm.MensRatingBack9;

                    dbTee.MenSlopeRatings[0].Slope = vm.MensSlope;
                    //dbTee.MenSlopeRatings[1].Slope = vm.MensSlopeFront9;
                    //dbTee.MenSlopeRatings[2].Slope = vm.MensSlopeBack9;

                    dbTee.WomenSlopeRatings[0].Rating = vm.WomensRating;
                    //dbTee.WomenSlopeRatings[1].Rating = vm.WomensRatingFront9;
                    //dbTee.WomenSlopeRatings[2].Rating = vm.WomensRatingBack9;

                    dbTee.WomenSlopeRatings[0].Slope = vm.WomensSlope;
                    //dbTee.WomenSlopeRatings[1].Slope = vm.WomansSlopeFront9;
                    //dbTee.WomenSlopeRatings[2].Slope = vm.WomansSlopeBack9;

                    dbTee.HoleDistances[0].Distance = vm[0];
                    dbTee.HoleDistances[1].Distance = vm[1];
                    dbTee.HoleDistances[2].Distance = vm[2];
                    dbTee.HoleDistances[3].Distance = vm[3];
                    dbTee.HoleDistances[4].Distance = vm[4];
                    dbTee.HoleDistances[5].Distance = vm[5];
                    dbTee.HoleDistances[6].Distance = vm[6];
                    dbTee.HoleDistances[7].Distance = vm[7];
                    dbTee.HoleDistances[8].Distance = vm[8];
                    dbTee.HoleDistances[9].Distance = vm[9];
                    dbTee.HoleDistances[10].Distance = vm[10];
                    dbTee.HoleDistances[11].Distance = vm[11];
                    dbTee.HoleDistances[12].Distance = vm[12];
                    dbTee.HoleDistances[13].Distance = vm[13];
                    dbTee.HoleDistances[14].Distance = vm[14];
                    dbTee.HoleDistances[15].Distance = vm[15];
                    dbTee.HoleDistances[16].Distance = vm[16];
                    dbTee.HoleDistances[17].Distance = vm[17];

                    Db.SaveChanges();

                    return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
                }
			}

			ViewData["Title"] = "Edit Tee";

            Globals.SetupAccountViewData(accountId, this.ViewData);
            return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long id)
		{
            bool success = false;
            var teeInfo = Db.GolfTeeInformations.Find(id);
            if (teeInfo != null)
            {
                Db.GolfTeeInformations.Remove(teeInfo);
                Db.SaveChanges();
            }

            if (Request.IsAjaxRequest())
			{
				return Json(success);
			}
			else
			{
				return RedirectToAction("Index", "Courses", new { area = "Golf", accountId = accountId });
			}
		}

        private IEnumerable<GolfTeeInformation> GetTeesIdAndNameForCourse(long courseId)
        {
            return (from ti in Db.GolfTeeInformations
                    where ti.CourseId == courseId
                    orderby ti.Priority ascending
                    select ti);
        }

    }
}
