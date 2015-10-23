using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Models
{
    public class ExternalLoginConfirmationViewModel
    {
        [Required]
        [Display(Name = "User name")]
        public string UserName { get; set; }
    }

    public class ManageUserViewModel
    {
        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Current password")]
        public string OldPassword { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "New password")]
        public string NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm new password")]
        [Compare("NewPassword", ErrorMessage = "The new password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }

        public long AccountId { get;  }

        public ManageUserViewModel()
        {
        }

        public ManageUserViewModel(long accountId)
        {
            AccountId = accountId;
        }
    }

    public class LoginViewModel
    {
        [Required]
        [Display(Name = "User name")]
        public string UserName { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password { get; set; }

        [Display(Name = "Remember me?")]
        public bool RememberMe { get; set; }
    }

    public class ResetPasswordViewModel
    {
        public ResetPasswordViewModel()
        {
        }

        public ResetPasswordViewModel(String token)
        {
            Token = token;
        }

        [Required]
        [EmailAddress]
        [Display(Name = "Email address")]
        public string UserName { get; set; }

        public string Token { get; set; }

        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "New Password")]
        public string Password { get; set; }
    }

    public class RegisterViewModel : AccountViewModel
    {
        public RegisterViewModel()
        {
            YearList = new List<System.Web.Mvc.SelectListItem>();
        }

        public RegisterViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            BirthDate = DateTime.Now;
            RegisterAccountId = accountId;
            InitYearList(accountId);
        }

        public void InitYearList(long accountId)
        {
            var yearList = new List<System.Web.Mvc.SelectListItem>();

            ModelObjects.Account account = Controller.Db.Accounts.Find(accountId);
            if (account != null)
            {
                int currentYear = DateTime.Now.Year;
                for (int i = account.FirstYear; i <= currentYear; ++i)
                {
                    yearList.Add(new System.Web.Mvc.SelectListItem() { Text = i.ToString() });
                }
            }

            YearList = yearList;            
        }

        public IEnumerable<System.Web.Mvc.SelectListItem> YearList { get; private set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm password")]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }

        [Required]
        [Display(Name = "Your name")]
        public string PlayerName { get; set; }

        [Required]
        public long PlayerId { get; set; }

        [Required]
        public long RegisterAccountId { get; set; }

        [Required]
        [Display(Name = "Birth date")]
        public DateTime BirthDate { get; set; }

        [Required]
        [Display(Name = "First year in league")]
        public new int FirstYear { get { return base.FirstYear; } set { base.FirstYear = value; } }

        [Required]
        [EmailAddress]
        [Display(Name = "Email address")]
        public String Email { get; set; }
    }
    
#region OAuth2 models
    public class ExternalLoginViewModel
    {
        public string Name { get; set; }

        public string Url { get; set; }

        public string State { get; set; }
    }

    public class ManageInfoViewModel
    {
        public string LocalLoginProvider { get; set; }

        public string Email { get; set; }

        public IEnumerable<UserLoginInfoViewModel> Logins { get; set; }

        public IEnumerable<ExternalLoginViewModel> ExternalLoginProviders { get; set; }
    }

    public class UserInfoViewModel
    {
        public string Email { get; set; }

        public bool HasRegistered { get; set; }

        public string LoginProvider { get; set; }
    }

    public class UserLoginInfoViewModel
    {
        public string LoginProvider { get; set; }

        public string ProviderKey { get; set; }
    }
#endregion

}
