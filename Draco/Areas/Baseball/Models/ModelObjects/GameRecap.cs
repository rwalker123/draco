using System;

namespace ModelObjects
{

	/// <summary>
	/// Summary description for GameRecap
	/// </summary>
	public class GameRecap
	{
		public GameRecap()
		{
		}

		public long GameId
		{
			get;
			set;
		}

		public long TeamId
		{
			get;
			set;
		}

		public string Recap
		{
			get;
			set;
		}

        public virtual Game Game { get; set; }
	}
}