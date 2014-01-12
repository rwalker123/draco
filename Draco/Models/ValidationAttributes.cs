using Microsoft.AspNet.Identity;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net.Http;
using System.Security.Principal;
using System.Web;
using System.Web.Http;
using System.Web.Security;

namespace SportsManager.Models
{

	public sealed class SportsManagerAuthorizeAttribute : AuthorizeAttribute
	{
        public override void OnAuthorization(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
			bool isAuthorized = false;

            IPrincipal user = HttpContext.Current.User;
            bool isAuthenticated = user.Identity.IsAuthenticated;

			// ROLES:
			// AccountAdmin
			// LeagueAdmin
			// TeamAdmin
			// TeamPhotoAdmin
			// PhotoAdmin
			// 
			// administrator user can access all.

            long accountId = 0;
            if (actionContext.ControllerContext.RouteData.Values.ContainsKey("accountId"))
                long.TryParse(actionContext.ControllerContext.RouteData.Values["accountId"].ToString(), out accountId);

            if (isAuthenticated)
            {
                // we are only providing role based authorization.
                if (!String.IsNullOrWhiteSpace(this.Roles))
                {
                    if (accountId != 0)
                    {
                        // check roles in reverse order from least restrictive to most. This allows
                        // only checking for the RouteData.Values that we need without having to pass
                        // all in every time. For example, a LeagueAdmin needs the leagueSeasonId, but 
                        // not the accountId.
                        if (this.Roles.Contains("TeamAdmin") || this.Roles.Contains("TeamPhotoAdmin"))
                        {
                            long teamSeasonId;
                            if (long.TryParse(actionContext.ControllerContext.RouteData.Values["teamSeasonId"].ToString(), out teamSeasonId))
                            {
                            }

                            isAuthorized = false;
                        }
                        else if (this.Roles.Contains("LeagueAdmin"))
                        {
                            long leagueSeasonId;
                            if (long.TryParse(actionContext.ControllerContext.RouteData.Values["leagueSeasonId"].ToString(), out leagueSeasonId))
                            {
                            }

                            isAuthorized = false;
                        }
                        else if (this.Roles.Contains("AccountAdmin"))
                        {
                            isAuthorized = DataAccess.Accounts.IsAccountAdmin(accountId, user.Identity.GetUserId());
                        }
                    }
                }
            }

            if (!isAuthorized)
                actionContext.Response = new HttpResponseMessage(System.Net.HttpStatusCode.Unauthorized);
        }
	}

	[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
	public sealed class PropertiesMustMatchAttribute : ValidationAttribute
	{
		private const string _defaultErrorMessage = "'{0}' and '{1}' do not match.";

		private readonly object _typeId = new object();

		public PropertiesMustMatchAttribute(string originalProperty, string confirmProperty)
			: base(_defaultErrorMessage)
		{
			OriginalProperty = originalProperty;
			ConfirmProperty = confirmProperty;
		}

		public string ConfirmProperty
		{
			get;
			private set;
		}

		public string OriginalProperty
		{
			get;
			private set;
		}

		public override object TypeId
		{
			get
			{
				return _typeId;
			}
		}

		public override string FormatErrorMessage(string name)
		{
			return String.Format(CultureInfo.CurrentUICulture, ErrorMessageString,
				OriginalProperty, ConfirmProperty);
		}

		public override bool IsValid(object value)
		{
			PropertyDescriptorCollection properties = TypeDescriptor.GetProperties(value);
			object originalValue = properties.Find(OriginalProperty, true /* ignoreCase */).GetValue(value);
			object confirmValue = properties.Find(ConfirmProperty, true /* ignoreCase */).GetValue(value);
			return Object.Equals(originalValue, confirmValue);
		}
	}

	[AttributeUsage(AttributeTargets.Field | AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
	public sealed class ValidatePasswordLengthAttribute : ValidationAttribute
	{
		private const string _defaultErrorMessage = "'{0}' must be at least {1} characters long.";

		private readonly int _minCharacters = Membership.Provider.MinRequiredPasswordLength;

		public ValidatePasswordLengthAttribute()
			: base(_defaultErrorMessage)
		{
		}

		public override string FormatErrorMessage(string name)
		{
			return String.Format(CultureInfo.CurrentUICulture, ErrorMessageString,
				name, _minCharacters);
		}

		public override bool IsValid(object value)
		{
			string valueAsString = value as string;
			return (valueAsString != null && valueAsString.Length >= _minCharacters);
		}
	}

	public sealed class RemoteAttribute : ValidationAttribute
	{
		public string Url { get; set; }

		public RemoteAttribute()
		{
			ErrorMessage = "Email address is already registered";
		}

		public override bool IsValid(object value)
		{
			return true;
		}
	}
}