using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using SportsManager;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.UI.WebControls;

/// <summary>
/// Summary description for Globals
/// </summary>
static public class Globals
{
	static private String m_appRootDir = String.Empty;
	static private String m_lastException = String.Empty;

	static public String LastException
	{
		get { return m_lastException; }
		set { m_lastException = value; }
	}

	static public String AppRootDir
	{
		get { return m_appRootDir; }
		set { m_appRootDir = value; }
	}

    static public string uploadDirRoot = null;
	static public string UploadDirRoot
	{
		get 
        {
            if (String.IsNullOrEmpty(uploadDirRoot))
            {
                uploadDirRoot = Storage.Provider.RootPath;
            }

            return uploadDirRoot;
        }
	}

	static public string UploadDir
	{
		get
		{
			// Don't use this anymore! Don't have "DataAccess.Accounts.GetCurrentAccount()" anymore, the accountId
            // is passed in the URL. There is no session data. Use UploadDirRoot and add the account id yourself.
			throw new NotImplementedException();
			//return ConfigurationManager.AppSettings["UploadDir"] + DataAccess.Accounts.GetCurrentAccount() + "/"; 
		}
	}

	static public string LogFile
	{
		get { return ConfigurationManager.AppSettings["LogFile"]; }
	}

	public static bool MailMessage(string fromEmail, string toEmail, string subject, string body)
	{
		bool sentMsg = true;

		MailAddress from = new MailAddress(fromEmail);

		// Set destinations for the e-mail message.
		MailAddress to = new MailAddress(toEmail);

		// Specify the message content.
		MailMessage msg = new MailMessage(from, to);
		msg.Subject = subject;
		msg.Body = body;
        msg.IsBodyHtml = true;

		SmtpClient mailClient = new SmtpClient();
		try
		{
			mailClient.Send(msg);
		}
		catch (Exception ex)
		{
			sentMsg = false;
			LogException(ex);
		}

		return sentMsg;
	}

	public static IEnumerable<MailAddress> MailMessage(string fromEmail, IEnumerable<MailAddress> bccList, string subject, string body)
	{
		List<MailAddress> failedSends = new List<MailAddress>();

		MailAddress from = new MailAddress(fromEmail);

		// Specify the message content.
		MailMessage msg = new MailMessage();
		msg.Subject = subject;
		msg.Body = body;
        msg.IsBodyHtml = true;
		msg.From = from;

		SmtpClient mailClient = new SmtpClient();

		foreach (MailAddress ma in bccList)
		{
			//msg.Bcc.Add(ma);
			msg.To.Clear();
			msg.To.Add(ma);
			try
			{
				mailClient.Send(msg);
			}
			catch (Exception ex)
			{
				failedSends.Add(ma);
				LogException(ex);
			}
		}

		return failedSends;
	}

	public static void SetFailedSendsLabel(List<MailAddress> failedSends, Label errorLabel)
	{
		if (failedSends.Count > 0)
		{
			System.Text.StringBuilder sb = new System.Text.StringBuilder();

			sb.Append("Failure sending your message has to " + failedSends.Count + " contacts. Delivery failed to the following Email addresses:<br/>");

			foreach (MailAddress ma in failedSends)
			{
				sb.Append("<br/>" + ma.Address);
			}

			errorLabel.Text = sb.ToString();
			errorLabel.Visible = true;
		}
	}

	public static void LogException(Exception ex)
	{
		System.Web.HttpContext context = System.Web.HttpContext.Current;
		if (context == null)
			return;

		String logPath = context.Server.MapPath(Globals.LogFile);
		string logDir = System.IO.Path.GetDirectoryName(logPath);
		if (!System.IO.Directory.Exists(logDir))
			System.IO.Directory.CreateDirectory(logDir);

		// prepend date to log file            
		string logFile = logDir + "\\" + DateTime.Today.ToString("MM-dd-yy.") + System.IO.Path.GetFileName(logPath);
		using (System.IO.TextWriter tw = System.IO.File.AppendText(logFile))
		{
			StringBuilder sb = new StringBuilder();

			sb.AppendLine(String.Format("{0} User: {1}", DateTime.Now, context.User.Identity.Name));
			sb.AppendLine(ex.ToString());

			Globals.LastException = sb.ToString();
			tw.WriteLine(Globals.LastException);
		}
	}

    public static void SetupAccountViewData(long accountId, ViewDataDictionary viewData)
    {
        var account = DataAccess.Accounts.GetAccount(accountId);
        string accountName = account.AccountName;
        string accountLogoUrl = account.LargeLogoURL;

        SetupAccountViewData(accountId, accountName, accountLogoUrl, account.AccountTypeId, account.AccountURL, viewData);
    }

    public static void SetupAccountViewData(long accountId, string accountName, string accountLogoUrl, long accountType, string accountUrl, ViewDataDictionary viewData)
    {
        viewData["AccountLogoUrl"] = accountLogoUrl;
        viewData["AccountName"] = accountName;
        viewData["AccountId"] = accountId;
        var accountUrls = accountUrl.Split(new char[] { ';' });
        viewData["AccountUrl"] = accountUrls.Length > 0 ? accountUrls[0] : String.Empty;

        string twitterAccountName = DataAccess.SocialIntegration.Twitter.TwitterAccountName(accountId);
        if (!String.IsNullOrEmpty(twitterAccountName))
            viewData["TwitterAccountName"] = twitterAccountName;

        string facebookFanPage = DataAccess.SocialIntegration.Facebook.FacebookFanPage(accountId);
        if (!String.IsNullOrEmpty(facebookFanPage))
            viewData["FacebookFanPage"] = facebookFanPage;

        string facebookApiKey = DataAccess.SocialIntegration.Facebook.GetApiKey((int)accountType);
        if (!String.IsNullOrEmpty(facebookApiKey))
            viewData["FacebookApiKey"] = facebookApiKey;

    }

    public static String GetCurrentUserId()
    {
        return System.Web.HttpContext.Current.User.Identity.GetUserId();
    }

    public static String GetCurrentUserName()
    {
        return System.Web.HttpContext.Current.User.Identity.GetUserName();
    }

    public static ApplicationUserManager GetUserManager()
    {
        return HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
    }
}

public class EmailUserValidator : IIdentityValidator<ApplicationUser>
{
    private static readonly Regex EmailRegex = new Regex(@"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    ApplicationUserManager _manager;

    public EmailUserValidator(ApplicationUserManager manager)
    {
        _manager = manager;
    }

    public async Task<IdentityResult> ValidateAsync(ApplicationUser item)
    {
        var errors = new List<string>();
        if (!EmailRegex.IsMatch(item.UserName))
            errors.Add("Enter a valid email address.");

        if (_manager != null)
        {
            var otherAccount = await _manager.FindByNameAsync(item.UserName);
            if (otherAccount != null && otherAccount.Id != item.Id)
                errors.Add("Select a different email address. An account has already been created with this email address.");
        }

        return errors.Any()
            ? IdentityResult.Failed(errors.ToArray())
            : IdentityResult.Success;
    }
}

