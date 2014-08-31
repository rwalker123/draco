using System.Web;
using System.Web.Optimization;

namespace SportsManager
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js",
                        "~/Scripts/jquery.cookie.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            bundles.Add(new ScriptBundle("~/bundles/knockout").Include(
                        "~/Scripts/knockout-{version}.js",
                        "~/Scripts/knockoutjs-helpers.js",
                        "~/Scripts/knockout.mapping-latest.js",
                        "~/Scripts/knockout.validation.js"));
                        

            bundles.Add(new ScriptBundle("~/bundles/bootstrap-wysiwyg").Include(
                //"~/Scripts/tinymce/tinymce.js",
                "~/Scripts/tinymce/jquery.tinymce.min.js",
                "~/Scripts/wysiwyg.js"));
                        

            bundles.Add(new ScriptBundle("~/bundles/jquery-file-upload").Include(
                    "~/Scripts/jQuery-File-Upload-9.5.4/js/vendor/jquery.ui.widget.js",
                    "~/Scripts/jQuery-File-Upload-9.5.4/js/jquery.iframe-transport.js",
                    "~/Scripts/jQuery-File-Upload-9.5.4/js/jquery.fileupload.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/moment.js",
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/bootstrap-select.js",
                      "~/Scripts/bootstrap-datepicker.js",
                      "~/Scripts/bootstrap-timepicker/bootstrap-timepicker.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/site.css"));

            bundles.Add(new StyleBundle("~/Content/bootstrap").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/bootstrap-select.css",
                      "~/Content/bootstrap-datepicker3.css",
                      "~/Content/bootstrap-timepicker/bootstrap-timepicker.css"));
        }
    }
}
