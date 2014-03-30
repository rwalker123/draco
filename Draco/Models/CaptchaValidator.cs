using System.Configuration;
using System.Web;

namespace SportsManager.Models
{
    public static class CaptchaValidator
    {
        private const string CHALLENGE_FIELD_KEY = "recaptcha_challenge_field";
        private const string RESPONSE_FIELD_KEY = "recaptcha_response_field";

        public static bool ValidateCaptcha(string captchaChallengeValue, string captchaResponseValue)
        {
            var captchaValidtor = new Recaptcha.RecaptchaValidator
            {
                PrivateKey = ConfigurationManager.AppSettings["recaptchaPrivateKey"],
                RemoteIP = HttpContext.Current.Request.UserHostAddress,
                Challenge = captchaChallengeValue,
                Response = captchaResponseValue
            };

            var recaptchaResponse = captchaValidtor.Validate();

            return recaptchaResponse.IsValid;
        }
    }
}