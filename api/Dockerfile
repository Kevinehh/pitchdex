# The API, its background workers and its one-off commands all run from this image.
# Build from the api folder: docker build -t pitchdex-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props Directory.Packages.props ./
COPY src/ src/
RUN dotnet publish src/Pitchdex.Api/Pitchdex.Api.csproj -c Release -o /app --no-self-contained /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS run
WORKDIR /app
COPY --from=build /app .
# Listens on 8080 as an ordinary user, not root.
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Pitchdex.Api.dll"]
