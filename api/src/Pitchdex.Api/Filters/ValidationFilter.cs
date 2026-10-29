using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Pitchdex.Api.Filters;

/// <summary>
/// Runs the FluentValidation rules for every action argument that has them, and
/// returns a standard 400 ProblemDetails response when any rule fails.
/// </summary>
public sealed class ValidationFilter(IServiceProvider services, ProblemDetailsFactory problemDetails) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (services.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var result = await validator.ValidateAsync(
                new ValidationContext<object>(argument),
                context.HttpContext.RequestAborted);

            if (result.IsValid)
            {
                continue;
            }

            // A fresh dictionary, so error keys are always the camelCase field names
            // the frontend uses, whether the value came from the query or the body.
            var errors = new ModelStateDictionary();
            foreach (var error in result.Errors)
            {
                errors.AddModelError(CamelCasePath(error.PropertyName), error.ErrorMessage);
            }

            context.Result = new BadRequestObjectResult(
                problemDetails.CreateValidationProblemDetails(context.HttpContext, errors));
            return;
        }

        await next();
    }

    /// <summary>"Steps[0].Subject" becomes "steps[0].subject": every segment, not just the first.</summary>
    private static string CamelCasePath(string path) =>
        string.Join('.', path.Split('.').Select(JsonNamingPolicy.CamelCase.ConvertName));
}
