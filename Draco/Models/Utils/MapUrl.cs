using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Models.Utils
{
    public static class MapUrlHelper
    {
        /// <summary>
        /// Get the URL from the physical path.
        /// </summary>
        /// <param name="serverUtilityHelper"></param>
        /// <param name="physicalPath"></param>
        /// <returns></returns>
        public static String MapUrl(this HttpServerUtility serverUtilityHelper, string physicalPath)
        {
            string rootServerPath = serverUtilityHelper.MapPath("~/");
            string physicalRoot = physicalPath.Replace(rootServerPath, "~/").Replace("~/", "/").Replace("\\", "/");
            physicalRoot = System.Web.VirtualPathUtility.ToAbsolute("~/").TrimEnd(new char[] { '/' }) + physicalRoot;
            string url = HttpContext.Current.Request.Url.AbsoluteUri.Replace(HttpContext.Current.Request.Url.PathAndQuery, "") + physicalRoot;
            return url;
        }
    }
}