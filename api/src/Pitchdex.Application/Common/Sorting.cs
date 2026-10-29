using System.Linq.Expressions;

namespace Pitchdex.Application.Common;

public enum SortDirection
{
    Asc,
    Desc,
}

public static class SortingExtensions
{
    public static IOrderedQueryable<T> OrderByDirection<T, TKey>(
        this IQueryable<T> source,
        Expression<Func<T, TKey>> key,
        SortDirection direction) =>
        direction == SortDirection.Desc ? source.OrderByDescending(key) : source.OrderBy(key);

    public static IOrderedQueryable<T> ThenByDirection<T, TKey>(
        this IOrderedQueryable<T> source,
        Expression<Func<T, TKey>> key,
        SortDirection direction) =>
        direction == SortDirection.Desc ? source.ThenByDescending(key) : source.ThenBy(key);
}
