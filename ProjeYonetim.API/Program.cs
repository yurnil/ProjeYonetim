// 1. Gerekli Kütüphaneler
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjeYonetim.API.Models; // Scaffold komutunun oluþturduðu klasör
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// .NET'in 'sub' claim'ini 'nameidentifier'a dönüþtürmesini engelle
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// 2. Servisleri Ekleme (Dependency Injection)

// Controller'larý ekle
builder.Services.AddControllers();

// Veritabaný Baðlantýsýný (DbContext) ekle
// (appsettings.json'daki "DefaultConnection"ý kullanýr)
builder.Services.AddDbContext<ProjeYonetimContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Kimlik Doðrulama (Authentication) servisini ekle
// 3. JWT KÝMLÝK DOÐRULAMA (Authentication) SERVÝSÝ (TAM VE HATASIZ HALÝ)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        // "DEDEKTÖR" KODUMUZ (O hayalet satýr olmadan, doðru yerde)
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                // BÝR HATA OLURSA, NEDENÝNÝ KONSOLA YAZ:
                Console.WriteLine("[AUTH FAILED]: " + context.Exception.ToString());
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                // BAÞARILI OLURSA KONSOLA YAZ:
                Console.WriteLine("[AUTH SUCCESS]: Token is valid!");
                return System.Threading.Tasks.Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // BÝR ÝSTEK GELÝR AMA TOKEN BULUNAMAZSA (401'in sebebi bu mu?)
                Console.WriteLine("[AUTH CHALLENGE]: No token found or invalid. Stopping request.");
                Console.WriteLine(context.Error);
                Console.WriteLine(context.ErrorDescription);

                context.HandleResponse(); // Bu çok önemli
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"error\": \"Token bulunamadi veya gecersiz (OnChallenge tetiklendi).\"}");
            }
        };
    });

// Swagger Ayarlarý (Authorize butonu dahil)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Authorization header. Örnek: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

// 3. HTTP Request Pipeline'ý (Ýþ Akýþý) Ayarlama
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();           // 1. Rotalarý belirle
app.UseAuthentication();    // 2. Biletini (Token) kontrol et
app.UseAuthorization();     // 3. Biletin VIP (Yetki) kontrolünü yap

app.MapControllers();       // 4. Controller'larý çalýþtýr
app.Run();