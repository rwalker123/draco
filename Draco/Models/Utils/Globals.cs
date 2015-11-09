using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using ModelObjects;
using SportsManager;
using SportsManager.Models;
using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Net.Mime;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

/// <summary>
/// Summary description for Globals
/// </summary>
static public class Globals
{
    static private string uploadDirRoot = null;
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

    public static string GetURLFromRequest(HttpRequest request)
    {
        string url = (request.ApplicationPath.Length > 0) ? request.Url.Authority + System.Web.HttpContext.Current.Request.ApplicationPath
                                                          : request.Url.Authority;
        if (!url.EndsWith("/"))
            url = url + "/";

        return url;
    }

	public static bool MailMessage(MailAddress fromEmail, MailAddress toEmail, string subject, string body)
	{
		bool sentMsg = true;

		// Specify the message content.
		MailMessage msg = new MailMessage(fromEmail, toEmail);
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

	public static IEnumerable<MailAddress> MailMessage(MailAddress fromEmail, IEnumerable<MailAddress> bccList, EmailUsersData data)
	{
		List<MailAddress> failedSends = new List<MailAddress>();

		// Specify the message content.
		MailMessage msg = new MailMessage();
		msg.Subject = data.Subject;
		msg.Body = data.Message;
        msg.IsBodyHtml = true;
		msg.From = fromEmail;

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

	public static void SetupAccountViewData(long accountId, ViewDataDictionary viewData)
    {
        var db = DependencyResolver.Current.GetService<DB>();

        var account = db.Accounts.Find(accountId);
        if (account == null)
            return;

        string accountName = account.Name;
        string accountLogoUrl = account.LargeLogoURL;

        SetupAccountViewData(account, viewData);
    }

    public static void SetupAccountViewData(Account account, ViewDataDictionary viewData)
    {
        viewData["AccountLogoUrl"] = account.LargeLogoURL;
        viewData["AccountName"] = account.Name;
        viewData["AccountId"] = account.Id;
        viewData["AccountUrl"] = account.AccountsURL.FirstOrDefault()?.URL ?? String.Empty;

        string twitterAccountName = account.TwitterAccountName;
        if (!String.IsNullOrEmpty(twitterAccountName))
            viewData["TwitterAccountName"] = twitterAccountName;

        string facebookFanPage = account.FacebookFanPage;
        if (!String.IsNullOrEmpty(facebookFanPage))
            viewData["FacebookFanPage"] = facebookFanPage;
    }

    public static String GetCurrentUserId()
    {
        return HttpContext.Current.User?.Identity.GetUserId();
    }

    public static String GetCurrentUserName()
    {
        return System.Web.HttpContext.Current.User?.Identity.GetUserName();
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
    static public string BuildFullName(string firstName, string middleName, string lastName)
    {
        string fullName = lastName + ", " + firstName + " " + middleName;
        return fullName.Trim();
    }

    static public string BuildFullNameFirst(string firstName, string middleName, string lastName)
    {
        System.Text.StringBuilder fullName = new System.Text.StringBuilder(firstName + " ");

        if (!String.IsNullOrWhiteSpace(middleName))
            fullName.Append(middleName + " ");

        fullName.Append(lastName);

        return fullName.ToString();
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

