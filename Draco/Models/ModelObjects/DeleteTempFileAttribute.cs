using System.Web.Mvc;

namespace SportsManager.Controllers.Attributes
{
    public class DeleteTempFileAttribute : ActionFilterAttribute
    {
        public override void OnResultExecuted(ResultExecutedContext filterContext)
        {
            filterContext.HttpContext.Response.Flush();
            string excelFileName = filterContext.Controller.TempData["tempFileName"] as string;
            System.IO.File.Delete(excelFileName);
        }
    }
}