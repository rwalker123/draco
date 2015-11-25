using System;
using System.Data;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.Xml;
using System.Xml.XPath;
using System.Net;
using System.IO;

/// <summary>
/// Summary description for RSSUtils
/// </summary>
public static class RSSUtils
{
    public static DataSet BindToRSS(string url)
    {
        if (url == null || url.Length == 0)
            return null;

        Stream str = new MemoryStream();
        XPathDocument doc;

        // Create the XslTransform. 
        System.Xml.Xsl.XslCompiledTransform xslt = new System.Xml.Xsl.XslCompiledTransform();

        // Load the stylesheet that creates XML Output. 
        xslt.Load(System.Web.HttpContext.Current.Server.MapPath("~/Controls/rss.xsl"));

        // Load the XML data file into an XPathDocument. 
        // if this is in the cache, grab it from there... 
        if (System.Web.HttpContext.Current.Cache["rss" + url] == null)
        {
            // No cache found. 
            try
            {
                doc = new System.Xml.XPath.XPathDocument(url);
                // Add to cache. 
                System.Web.HttpContext.Current.Cache.Add("rss" + url, doc, null, DateTime.Now.AddMinutes(60), TimeSpan.Zero, System.Web.Caching.CacheItemPriority.High, null);
            }
            catch
            {
                return null;
            }
        }
        else
        {
            // Cache found. 
            doc = (XPathDocument)System.Web.HttpContext.Current.Cache["rss" + url];
        }

        // Create an XmlWriter which will output to our stream.   
        XmlWriter xw = new XmlTextWriter(str, System.Text.Encoding.UTF8);

        // Transform the feed. 
        xslt.Transform(doc, xw);

        // Flush the XmlWriter and set the position of the stream to 0 
        xw.Flush();
        str.Position = 0;

        // Create a dataset to bind to the control.     
        DataSet ds = new DataSet();
        ds.ReadXml(str);

        // Close the writer and thereby free the memory stream. 
        xw.Close();

        return ds;
    }

}
