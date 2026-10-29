namespace Pitchdex.Application.Common;

/// <summary>
/// A request that's valid but can't be done right now, such as messaging a lead with
/// no LinkedIn profile. Returned as a 409 with the message shown to the founder.
/// </summary>
public sealed class UseCaseException(string message) : Exception(message);

/// <summary>Something the request names doesn't exist. Returned as a 404.</summary>
public sealed class NotFoundException(string message) : Exception(message);
