using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Handouts
	/// </summary>
	abstract public class Handout
	{
		private string m_handoutName = "handout";

		public Handout()
		{
		}

		public Handout(long id, string description, string filename, long referenceId)
		{
			Id = id;
			Description = description;
			FileName = filename;
			ReferenceId = referenceId;
		}

        public long Id { get; set; }
		public string Description { get; set; }
		public string FileName { get; set; }
		public long ReferenceId { get; set; }
		abstract protected string HandoutDir { get; }

		public string HandoutFileURL
		{
			get
			{
				if (HandoutFile != null)
				{
					string handoutURL = HandoutDir + Id + m_handoutName;
					return handoutURL.Replace("http://", "file://");
				}
				else
				{
					return null;
				}
			}
		}

		public string HandoutDownloadURL
		{
			get
			{
				String downloadURL = "~/Forms/FileDownload.aspx";
				String handoutFile = System.Web.HttpContext.Current.Server.HtmlEncode(HandoutFile);
				String fileName = System.Web.HttpContext.Current.Server.HtmlEncode(FileName);

				String urlParams = "?downloadPath=" + handoutFile + "&localFileName=" + fileName + "";

				return downloadURL + urlParams;
			}
		}

		public string HandoutURL
		{
			get
			{
				if (HandoutFile != null)
					return HandoutDir + Id + m_handoutName;
				else
					return null;
			}
		}

		public string HandoutURLName
		{
			get
			{
				return HandoutDir + Id + m_handoutName;
			}
		}

		public string HandoutFile
		{
			get
			{
				string logoPath = System.Web.HttpContext.Current.Server.MapPath(HandoutDir + Id + m_handoutName);
				System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
				if (fileInfo.Exists)
					return fileInfo.FullName;
				else
					return null;
			}
		}
	}

	public class TeamHandout : Handout
	{
		public TeamHandout()
		{
		}

		public TeamHandout(long id, string description, string filename, long referenceId)
			: base(id, description, filename, referenceId)
		{
		}

		protected override string  HandoutDir
		{
			get 
			{ 
				return Globals.UploadDir + @"Teams\" + ReferenceId + @"\"; 
			}
		}
	}

	public class AccountHandout : Handout
	{
		public AccountHandout()
		{
		}

		public AccountHandout(long id, string description, string filename, long referenceId)
			: base(id, description, filename, referenceId)
		{
		}

		protected override string HandoutDir
		{
			get
			{
				return Globals.UploadDir;
			}
		}
	}
}
