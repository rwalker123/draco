using System;

namespace SportsManager
{
    public partial class CleanMessageBoard : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            DataAccess.MessageBoard.CleanupMessageBoard();
        }
    }
}