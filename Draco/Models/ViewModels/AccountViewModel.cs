using Microsoft.AspNet.Identity;
using System;
using System.ComponentModel.DataAnnotations;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class AccountViewModel
    {
        ModelObjects.Account m_account;

        public AccountViewModel()
        {

        }

        public AccountViewModel(Controller c, long accountId)
        {
            AccountId = accountId;
            Controller = c;
            ContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());
            m_account = DataAccess.Accounts.GetAccount(accountId);
            AccountName = m_account.AccountName;

            FirstYear = m_account.FirstYear;

            if (m_account.HasLargeLogo)
                AccountLogoUrl = m_account.LargeLogoURL;
            
            CurrentSeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            IsAdmin = DataAccess.Accounts.IsAccountAdmin(AccountId, HttpContext.Current.User.Identity.GetUserId());
            c.ViewData["IsAdmin"] = IsAdmin;

            Globals.SetupAccountViewData(accountId, AccountName, AccountLogoUrl, m_account.AccountTypeId, m_account.AccountURL, c.ViewData);
        }

        [ScaffoldColumn(false)]
        public int FirstYear { get; set; }

        [ScaffoldColumn(false)]
        protected ModelObjects.Account Account
        {
            get { return m_account; }
        }

        [ScaffoldColumn(false)]
        public Controller Controller
        {
            get;
            private set;
        }

        [ScaffoldColumn(false)]
        public long AccountId
        {
            get;
            set;
        }

        [ScaffoldColumn(false)]
        public String AccountName
        {
            get;
            private set;
        }

        [ScaffoldColumn(false)]
        public string AccountLogoUrl
        {
            get;
            private set;
        }

        [ScaffoldColumn(false)]
        public long CurrentSeasonId
        {
            get;
            private set;
        }

        [ScaffoldColumn(false)]
        public bool IsAdmin
        {
            get;
            protected set;
        }

        [ScaffoldColumn(false)]
        public long ContactId
        {
            get;
            protected set;
        }

    }
}