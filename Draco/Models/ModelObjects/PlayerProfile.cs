
namespace ModelObjects
{
/// <summary>
/// Summary description for PlayerProfile
/// </summary>
	public class PlayerProfile
	{
		public PlayerProfile()
		{
		}

		public PlayerProfile(long playerId)
		{
		    PlayerId = playerId;
		}

        public long PlayerId
		{
			get;
			set;
		}

        public string LastName
        {
            get;
            set;
        }

        public string FirstName
        {
            get;
            set;
        }

        public string MiddleName
        {
            get;
            set;
        }

        public string PhotoUrl
        {
            get;
            set;
        }
	}
}
