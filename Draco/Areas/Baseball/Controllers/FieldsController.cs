using System.Collections.Generic;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Models;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class FieldsController : Controller
	{
		//
		// GET: /Baseball/Fields/{lid}

		// disable cache so that ajax call can be made.
		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult Index(long? accountId)
		{
			if (accountId.GetValueOrDefault(0) == 0)
			{
				return RedirectToAction("Index", "League");
			}

			return View("Fields", new LeagueFieldsViewModel(this, accountId.Value));
		}

		//
		// GET: /Baseball/Fields/{lid}/Details/{id}

		public ActionResult Details(int id)
		{
			return View();
		}

		//
		// GET: /Baseball/Fields/{lid}/Create

		public ActionResult Create()
		{
			return View();
		}

		//
		// GET: /Baseball/Fields/{lid}/Create

		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long? accountId, Field f)
		{
			try
			{
				bool success = false;
				if (accountId.GetValueOrDefault(0) != 0)
				{
					f.AccountId = accountId.Value;

					success = DataAccess.Fields.AddField(f);
				}

				if (Request.IsAjaxRequest())
				{
					return Json(new
					{
						status = success,
						errorText = Globals.LastException
					});
				}
				else
				{
					if (success)
						return RedirectToAction("Index");
					else
						return View();
				}
			}
			catch
			{
				return View();
			}
		}

		//
		// GET: /Baseball/Fields/{lid}/Edit/{id}

		public ActionResult Edit(long? accountId, long id)
		{
			return View();
		}

		//
		// POST: /Baseball/Fields/{lid}/Edit/{id}

		[HttpPost]
		public ActionResult Edit(long? accountId, long id, Field f)
		{
			try
			{
				bool success = false;
				if (accountId.GetValueOrDefault(0) != 0)
				{
					f.AccountId = accountId.Value;

					success = DataAccess.Fields.ModifyField(f);
				}

				if (Request.IsAjaxRequest())
				{
					return Json(new
					{
						status = success,
						errorText = Globals.LastException
					});
				}
				else
				{
					if (success)
						return RedirectToAction("Index");
					else
						return View();
				}
			}
			catch
			{
				return View();
			}
		}

		//
		// POST: /Baseball/Fields/{lid}/Delete/{id}

		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long id)
		{
			try
			{
				bool success = DataAccess.Fields.RemoveField(id);

				if (Request.IsAjaxRequest())
				{
					return Json(success);
				}
				else
				{
					return RedirectToAction("Index");
				}
			}
			catch
			{
				return View();
			}
		}
	}
}
