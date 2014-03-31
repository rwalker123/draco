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
                        // support multiple roles, the user can be authorized in any of the roles (i.e. multiple roles are an "or" match)
                        if (this.Roles.Contains("AccountAdmin"))
                        {
                            isAuthorized = DataAccess.Accounts.IsAccountAdmin(accountId, user.Identity.GetUserId());
                        }

                        if (!isAuthorized)
                        {
                            if (this.Roles.Contains("LeagueAdmin"))
                            {
                                long leagueSeasonId;
                                var sId = actionContext.ControllerContext.RouteData.Values["leagueSeasonId"];
                                if (sId != null && long.TryParse(sId.ToString(), out leagueSeasonId))
                                {
                                }
                            }
                        }

                        if (!isAuthorized)
                        {
                            if (this.Roles.Contains("TeamAdmin") || this.Roles.Contains("TeamPhotoAdmin"))
                            {
                                long teamSeasonId;
                                var sId = actionContext.ControllerContext.RouteData.Values["teamSeasonId"];
                                if (sId != null && long.TryParse(sId.ToString(), out teamSeasonId))
                                {
                                    if (this.Roles.Contains("TeamAdmin"))
                                        isAuthorized = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId, user.Identity.GetUserId());
                                    
                                    if (!isAuthorized && this.Roles.Contains("TeamPhotoAdmin"))
                                        isAuthorized = DataAccess.Teams.IsTeamPhotoAdmin(accountId, teamSeasonId, user.Identity.GetUserId());
                                }
                            }
                        }
                    }
                }
            }

            if (!isAuthorized)
                actionContext.Response = new HttpResponseMessage(System.Net.HttpStatusCode.Forbidden);
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