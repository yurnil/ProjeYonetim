using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjeYonetim.API.DTOs;
using ProjeYonetim.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks; 
using BCrypt.Net;             

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ProjeYonetimContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return BadRequest("Bu e-posta adresi zaten kullanılıyor.");
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
            var newUser = new User
            {
                FullName = registerDto.FullName,
                Email = registerDto.Email,
                PasswordHash = hashedPassword,
                Role = "User",
                IsEnabled = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return StatusCode(201, "Kullanıcı başarıyla oluşturuldu.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            // DİKKAT: .Users'tan sonra .SingleOrDefaultAsync kullanıyoruz
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash) || !user.IsEnabled)
            {
                return Unauthorized("Geçersiz e-posta veya şifre.");
            }

            string token = GenerateJwtToken(user);
            return Ok(new { token = token });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                // DİKKAT: Burası 'UserId' olmalı (küçük 'd'). Scaffold böyle oluşturur.
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}