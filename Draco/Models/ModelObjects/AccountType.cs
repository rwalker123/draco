using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for AccountType
	/// </summary>
	public class AccountType
	{
        public long Id { get; set; }
        public string Name { get; set; }
        public string HomePageFilePath { get; set; }

		public AccountType()
		{
		}

		public AccountType(long id, string name, string homePageFilePath)
		{
			Id = id;
			Name = name;
            HomePageFilePath = homePageFilePath;
		}
	}
}