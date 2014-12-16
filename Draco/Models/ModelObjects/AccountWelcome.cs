using System;
using System.Configuration;

namespace ModelObjects
{
    public class AccountWelcome
    {
        public AccountWelcome()
        {
        }

        public AccountWelcome(long id, long accountId, short orderNo, string captionText, string accountText)
        {
            Id = id;
            AccountId = accountId;
            OrderNo = orderNo;
            CaptionMenu = captionText;
            WelcomeText = accountText;
        }

        public long Id { get; set; }
        public long AccountId { get; set; }
        public short OrderNo { get; set; }
        public string CaptionMenu { get; set; }
        public string WelcomeText { get; set; }
        public long TeamId { get; set; }
    }
}