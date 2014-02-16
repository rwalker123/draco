using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Handouts
	/// </summary>
	abstract public class Handout
	{
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

		public string HandoutURL
		{
			get
			{
				return HandoutDir + Id + "/" + FileName;
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
				return Globals.UploadDirRoot + "Teams/" + ReferenceId + "/Handouts/"; 
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
				return Globals.UploadDirRoot + "Accounts/" + ReferenceId + "/Handouts/";
			}
		}
	}
}
