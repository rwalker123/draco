using Microsoft.AspNet.Identity;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;
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
            ContactId = (c.GetCurrentContact()?.Id).GetValueOrDefault();
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

            Globals.SetupAccountViewData(m_account, c.ViewData);
        }

        private Dictionary<long, string> m_teamIdToName = new Dictionary<long, string>();

        public string TeamName(long teamId)
        {
            string teamName;
            if (m_teamIdToName.TryGetValue(teamId, out teamName))
                return teamName;

            m_teamIdToName[teamId] = Controller.Db.TeamsSeasons.Find(teamId)?.Name;
            return m_teamIdToName[teamId];
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