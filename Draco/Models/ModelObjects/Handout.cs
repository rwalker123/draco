using SportsManager.Models.Utils;
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

		public Handout(long id, string description, string filename)
		{
			Id = id;
			Description = description;
			FileName = filename;
		}

        public long Id { get; set; }
		public string Description { get; set; }
		public string FileName { get; set; }
		abstract protected string HandoutDir { get; }

		public string HandoutURL
		{
			get
			{
				return Storage.Provider.GetUrl(HandoutDir + Id + "/" + FileName);
			}
		}

	}

	public class TeamHandout : Handout
	{
		public TeamHandout()
		{
		}

		public TeamHandout(long id, string description, string filename, long referenceId)
			: base(id, description, filename)
		{
            TeamId = referenceId;
		}

		protected override string  HandoutDir
		{
			get 
			{ 
				return Globals.UploadDirRoot + "Teams/" + TeamId + "/Handouts/"; 
			}
		}

        public long TeamId { get; set; }

	}

}
