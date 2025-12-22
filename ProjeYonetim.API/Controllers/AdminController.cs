using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Data;
using ProjeYonetim.API.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")] 
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public AdminController(ProjeYonetimContext context)
        {
            _context = context;
        }

        
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        { 
            var users = await _context.Users
                .Select(u => new UserDto 
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role,
                    IsEnabled = u.IsEnabled
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var adminIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (int.Parse(adminIdString) == id)
            {
                return BadRequest("Admin kendi hesabını silemez.");
            }

            var userToDelete = await _context.Users.FindAsync(id);
            if (userToDelete == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            
            _context.Users.Remove(userToDelete);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kullanıcı (ve tüm verileri) başarıyla silindi." });
        }

        [HttpPut("users/{id}/toggle")]
        public async Task<IActionResult> ToggleUserAccount(int id)
        {
            var userToToggle = await _context.Users.FindAsync(id);
            if (userToToggle == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            userToToggle.IsEnabled = !userToToggle.IsEnabled;

            _context.Users.Update(userToToggle);
            await _context.SaveChangesAsync();

            string status = userToToggle.IsEnabled ? "aktif hale getirildi" : "askıya alındı";
            return Ok(new { message = $"Kullanıcı hesabı başarıyla {status}." });
        }
    }
}