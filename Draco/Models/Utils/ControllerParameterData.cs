using System.ComponentModel.DataAnnotations;

public class IdData
{
    public string Id { get; set; }
}

public class AccountNameYearData : IdData
{
    public int Year { get; set; }
    public string TwitterAccount { get; set; }
}

public class KeyValueData : IdData
{
    public string Value { get; set; }
}

public class ScriptData
{
    public string Script { get; set; }
}

public class DbIdStringValue
{
    public long Id { get; set; }
    public string Value { get; set; }
}

