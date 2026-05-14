using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjeYonetim.API.Data;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;


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
                Skills = user.Skills ?? "Henüz yetenek eklenmedi",
                ProfilePicture = user.ProfilePicture // <-- include profile picture here
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
            user.ProfilePicture = dto.ProfilePicture;


            await _context.SaveChangesAsync();
            return Ok(new { message = "Profil başarıyla güncellendi!" });
        }

        [HttpPost("upload")]
        [RequestSizeLimit(5 *1024 *1024)] // allow up to5MB for this endpoint
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound("Kullanıcı bulunamadı.");

            if (file == null || file.Length ==0)
                return BadRequest("Dosya seçilmedi.");

            if (file.Length >2 *1024 *1024)
                return BadRequest("Dosya boyutu en fazla2MB olabilir.");

            if (!file.ContentType.StartsWith("image/"))
                return BadRequest("Sadece resim dosyaları yüklenebilir.");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension))
            {
                extension = file.ContentType switch
                {
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    _ => ".jpg"
                };
            }

            var fileName = Guid.NewGuid().ToString("N") + extension;
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";

            user.ProfilePicture = url;
            await _context.SaveChangesAsync();

            return Ok(new { url });
        }
    }


    public class ProfileUpdateDto
    {
        public string FullName { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
        public string Skills { get; set; }
        public string? ProfilePicture { get; set; }
        public ProfileUpdateDto() { }
    }
}