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
using System.Net.Mime;
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

    public static string GetURLFromRequest(HttpRequest request)
    {
        string url = (request.ApplicationPath.Length > 0) ? request.Url.Authority + System.Web.HttpContext.Current.Request.ApplicationPath
                                                          : request.Url.Authority;
        if (!url.EndsWith("/"))
            url = url + "/";

        return url;
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
            Elmah.ErrorSignal.FromCurrentContext().Raise(ex);
        }

		return sentMsg;
	}

	public static IEnumerable<MailAddress> MailMessage(string fromEmail, IEnumerable<MailAddress> bccList, EmailUsersData data)
	{
		List<MailAddress> failedSends = new List<MailAddress>();

		MailAddress from = new MailAddress(fromEmail);

		// Specify the message content.
		MailMessage msg = new MailMessage();
		msg.Subject = data.Subject;
		msg.Body = data.Message;
        msg.IsBodyHtml = true;
		msg.From = from;

		SmtpClient mailClient = new SmtpClient();

        if (data.Attachments != null)
        {
            foreach (var attachment in data.Attachments)
            {
                string fileName = HttpContext.Current.Server.MapPath(attachment.fileUri);

                // Create  the file attachment for this e-mail message.
                Attachment attachmentData = new Attachment(fileName, MediaTypeNames.Application.Octet);
                attachmentData.Name = attachment.fileName;
                // Add time stamp information for the file.
                ContentDisposition disposition = attachmentData.ContentDisposition;
                disposition.CreationDate = System.IO.File.GetCreationTime(fileName);
                disposition.ModificationDate = System.IO.File.GetLastWriteTime(fileName);
                disposition.ReadDate = System.IO.File.GetLastAccessTime(fileName);
                // Add the file attachment to this e-mail message.
                msg.Attachments.Add(attachmentData);
            }
        }

		try
		{
            foreach (MailAddress ma in bccList)
            {
                msg.To.Add(ma);
                mailClient.Send(msg);
                msg.To.RemoveAt(0);
            }

		}
		catch (Exception ex)
		{
            Elmah.ErrorSignal.FromCurrentContext().Raise(ex);
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

    public static int CalculateAge(DateTime birthDate)
    {
        DateTime today = DateTime.Today;
        int years = today.Year - birthDate.Year;
        if (today.Month == birthDate.Month)
        {
            if (today.Day < birthDate.Day)
                years--;
        }
        else if (today.Month < birthDate.Month)
        {
            years--;
        }

        return years;
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

