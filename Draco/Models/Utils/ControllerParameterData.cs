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

public class UriData
{
    [Required]
    [RegularExpression(@"^http(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$", ErrorMessage = "URL format is wrong")]
    public string Uri { get; set; }
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

