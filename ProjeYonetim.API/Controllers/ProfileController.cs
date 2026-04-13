using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjeYonetim.API.Data;
using System.Security.Claims;
using System.Threading.Tasks;


namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class ProfileController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public ProfileController(ProjeYonetimContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound("Kullanıcı bulunamadı.");

            return Ok(new
            {
                user.FullName,
                user.Email,
                Role = user.Role ?? "Unvan Girilmedi",
                Department = user.Department ?? "Departman Girilmedi",
                Skills = user.Skills ?? "Henüz yetenek eklenmedi"
            });
        }


        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound();


            user.FullName = dto.FullName;
            user.Role = dto.Role;
            user.Department = dto.Department;
            user.Skills = dto.Skills;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profil başarıyla güncellendi!" });
        }
    }


    public class ProfileUpdateDto
    {
        public string FullName { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
        public string Skills { get; set; }
    }
}