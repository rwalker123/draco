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
        public string FilePath { get; set; }
        public string FacebookAppId { get; set; }
        public string FacebookSecretKey { get; set; }
        public string TwitterAppId { get; set; }
        public string TwitterSecret { get; set; }

		public AccountType()
		{
		}

		public AccountType(long id, string name, string homePageFilePath)
		{
			Id = id;
			Name = name;
            FilePath = homePageFilePath;
		}
	}
}