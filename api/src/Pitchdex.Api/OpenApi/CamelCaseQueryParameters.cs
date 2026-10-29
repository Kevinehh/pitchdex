using System.Text.Json;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Pitchdex.Api.OpenApi;

/// <summary>
/// Documents query parameters in camelCase (page, pageSize) to match JSON bodies.
/// Query binding ignores case, so the frontend's camelCase names bind correctly.
/// </summary>
internal sealed class CamelCaseQueryParameters : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        foreach (var parameter in operation.Parameters ?? [])
        {
            if (parameter is OpenApiParameter { In: ParameterLocation.Query, Name: { } name } query)
            {
                query.Name = JsonNamingPolicy.CamelCase.ConvertName(name);
            }
        }

        return Task.CompletedTask;
    }
}
