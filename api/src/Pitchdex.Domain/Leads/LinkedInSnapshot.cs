namespace Pitchdex.Domain.Leads;

/// <summary>
/// What a lead's LinkedIn profile showed when it was last looked up, kept so lists can show
/// a picture and headline without asking LinkedIn each time. Refreshed every couple of weeks;
/// LinkedIn's picture links stop working after about three.
/// </summary>
public sealed class LinkedInSnapshot
{
    public string? Headline { get; set; }

    public string? Location { get; set; }

    public string? PictureUrl { get; set; }

    /// <summary>How close the lead is to the account that looked them up.</summary>
    public LinkedInDegree? Degree { get; set; }

    /// <summary>Anyone can message an open profile, even without a connection.</summary>
    public bool IsOpenProfile { get; set; }

    public bool IsPremium { get; set; }

    public DateTimeOffset FetchedAt { get; set; }
}

public enum LinkedInDegree
{
    First,
    Second,
    Third,
    OutOfNetwork,
}
