using System;
using System.Data;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;


/// <summary>
/// Summary description for YesNoDataSource
/// </summary>
static public class YesNoDataSource
{
	static public ListItem[] GetYesNoData()
	{
		ListItem[] d = new ListItem[2];
		d[0] = new ListItem("No", Boolean.FalseString);
		d[1] = new ListItem("Yes", Boolean.TrueString);
		return d;
	}

}
