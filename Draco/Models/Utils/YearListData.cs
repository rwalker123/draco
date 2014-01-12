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
/// Summary description for YearListData
/// </summary>
public class YearListData
{
	private int m_year;

	public YearListData(int year)
	{
		m_year = year;
	}

	public string ListDisplay
	{
		get { return m_year.ToString(); }
	}

	public int ListValue
	{
		get { return m_year; }
	}

}
