using Microsoft.AspNet.Identity;
using SportsManager.Controllers;
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

        public AccountViewModel(DBController c, long accountId)
        {
            AccountId = accountId;
            Controller = c;
            ContactId = c.GetCurrentContact().Id;
            m_account = c.Db.Accounts.Find(accountId);
            if (m_account == null)
                return;

            AccountName = m_account.Name;

            FirstYear = m_account.FirstYear;

            if (m_account.HasLargeLogo)
                AccountLogoUrl = m_account.LargeLogoURL;
            
            CurrentSeasonId = c.GetCurrentSeasonId(accountId);
            IsAdmin = c.IsAccountAdmin(AccountId, HttpContext.Current.User.Identity.GetUserId());
            c.ViewData["IsAdmin"] = IsAdmin;

            Globals.SetupAccountViewData(accountId, AccountName, AccountLogoUrl, m_account.AccountTypeId, m_account.Url, c.ViewData);
        }

        [ScaffoldColumn(false)]
        public int FirstYear { get; set; }

        [ScaffoldColumn(false)]
        protected ModelObjects.Account Account
        {
            get { return m_account; }
        }

        [ScaffoldColumn(false)]
        public DBController Controller
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