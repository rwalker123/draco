
namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffSeed
/// </summary>
    public class PlayoffSeed
	{
        public long Id { get; set; } // id (Primary key)
        public long PlayoffId { get; set; } // PlayoffId
        public long TeamId { get; set; } // TeamId
        public int SeedNo { get; set; } // SeedNo

        // Foreign keys
        public virtual PlayoffSetup PlayoffSetup { get; set; } // FK_PlayoffSeeds_PlayoffSetup

	}
}