using System.Configuration;
using System.IO;
using System.Web.Mvc;
using System.Web.UI;

namespace SportsManager.Models.Helpers
{
    public static class CaptchaHelper
    {
        public static MvcHtmlString GenerateCaptcha(this HtmlHelper helper)
        {

            var captchaControl = new Recaptcha.RecaptchaControl
                    {
                        ID = "recaptcha",
                        Theme = "clean",
                        PublicKey = ConfigurationManager.AppSettings["recaptchaPublicKey"],
                        PrivateKey = ConfigurationManager.AppSettings["recaptchaPrivateKey"]
                    };

            var htmlWriter = new HtmlTextWriter(new StringWriter());

            captchaControl.RenderControl(htmlWriter);

            return MvcHtmlString.Create(htmlWriter.InnerWriter.ToString());
        }
    }
}