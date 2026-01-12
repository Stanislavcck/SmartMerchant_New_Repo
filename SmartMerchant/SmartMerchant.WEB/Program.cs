using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.Cookies;
using Newtonsoft.Json;
using Auth0.AspNetCore.Authentication;
using SmartMerchant.Application;
using SmartMerchant.WEB.Middleware;

namespace SmartMerchant.WEB
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.InputEncoding = System.Text.Encoding.UTF8;
            Console.OutputEncoding = System.Text.Encoding.UTF8;

            var builder = WebApplication.CreateBuilder(args);

            ConfigureServices(builder.Services, builder.Configuration);

            var app = builder.Build();

            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
            }

            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMerchantCheck();
            app.MapRazorPages();

            app.UseSwagger();
            app.UseSwaggerUI();
            app.MapControllers();

            app.Run();
        }

        private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            // Add Data Protection (required for OAuth state management)
            services.AddDataProtection();
            
            services.AddRazorPages();

            services.AddControllersWithViews(options => { })
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.DefaultContractResolver
                {
                    NamingStrategy = new Newtonsoft.Json.Serialization.DefaultNamingStrategy() // makes it case-insensitive
                };
            });

            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
            services.AddSwaggerGenNewtonsoftSupport();

            var databaseConfig = configuration.GetSection("Services")["Database"];

            if (!string.IsNullOrEmpty(databaseConfig))
            {
                // Determine database provider from connection string
                var isInMemory = databaseConfig.Contains(":memory:", StringComparison.OrdinalIgnoreCase);
                var isSqlite = databaseConfig.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) && !isInMemory;
                
                if (isInMemory)
                {
                    services.AddDbContext<DatabaseContext>(options =>
                    {
                        options.UseInMemoryDatabase("SmartMerchantDb");
                    });

                    var databaseContext = new DatabaseContext(
                        new DbContextOptionsBuilder<DatabaseContext>()
                        .UseInMemoryDatabase("SmartMerchantDb")
                        .Options);

                    databaseContext.Database.EnsureCreated();
                    DatabaseSeeder.Seed(databaseContext);
                }
                else if (isSqlite)
                {
                    services.AddDbContext<DatabaseContext>(options =>
                    {
                        options.UseSqlite(databaseConfig);
                    });

                    var databaseContext = new DatabaseContext(
                        new DbContextOptionsBuilder<DatabaseContext>()
                        .UseSqlite(databaseConfig)
                        .Options);

                    databaseContext.Database.EnsureCreated();
                    DatabaseSeeder.Seed(databaseContext);
                }
                else
                {
                    // Default to PostgreSQL
                    services.AddDbContext<DatabaseContext>(options =>
                    {
                        options.UseNpgsql(databaseConfig);
                    });

                    var databaseContext = new DatabaseContext(
                        new DbContextOptionsBuilder<DatabaseContext>()
                        .UseNpgsql(databaseConfig)
                        .Options);

                    databaseContext.Database.EnsureCreated();
                    DatabaseSeeder.Seed(databaseContext);
                }
            }

            // Register Repository as scoped for each entity type
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Register AuthorizationManager
            services.AddScoped<AuthorizationManager>();

            // Register MerchantManager
            services.AddScoped<MerchantManager>();

            // Register InvoiceManager
            services.AddScoped<InvoiceManager>();

            // Register CardManager
            services.AddScoped<CardManager>();

            // Register DashboardManager
            services.AddScoped<DashboardManager>();

            // Configure Auth0 Authentication
            var auth0Domain = configuration["Okta:Domain"];
            var auth0ClientId = configuration["Okta:ClientId"];
            var auth0ClientSecret = configuration["Okta:ClientSecret"];

            if (!string.IsNullOrEmpty(auth0Domain) && !string.IsNullOrEmpty(auth0ClientId) && !string.IsNullOrEmpty(auth0ClientSecret))
            {
                services.AddAuth0WebAppAuthentication(options =>
                {
                    options.Domain = auth0Domain;
                    options.ClientId = auth0ClientId;
                    options.ClientSecret = auth0ClientSecret;
                    options.CallbackPath = "/signin-auth0";
                    options.SkipCookieMiddleware = false;
                })
                .WithAccessToken(options =>
                {
                    // Optional: Configure token audience if needed
                });

                services.Configure<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme, options =>
                {
                    options.LoginPath = "/Login";
                    options.LogoutPath = "/api/okta/logout";
                    options.ExpireTimeSpan = TimeSpan.FromDays(30);
                    options.SlidingExpiration = true;
                    options.Cookie.SameSite = SameSiteMode.Lax;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                });
            }
        }
    }
}
