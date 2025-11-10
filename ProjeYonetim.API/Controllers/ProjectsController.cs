using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.DTOs;
using ProjeYonetim.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ProjectsController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public ProjectsController(ProjeYonetimContext context)
        {
            _context = context;
        }

        // POST: api/projects
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateDto projectDto)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("Token'dan e-posta adresi okunamadı.");
            }

            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == userEmail);
            if (user == null)
            {
                return Unauthorized("Token'daki e-posta ile eşleşen kullanıcı bulunamadı.");
            }

            int userId = user.UserId;

            var newProject = new Project
            {
                ProjectName = projectDto.ProjectName,
                Description = projectDto.Description,
                OwnerUserId = userId, // DOĞRU İSİM (Küçük 'd')
                CreatedAt = DateTime.Now
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();

            // "Temiz" DTO'yu oluştur (TÜM İSİMLER DÜZELTİLDİ)
            var projectToReturn = new ProjectDto
            {
                ProjectId = newProject.ProjectId,     // Küçük 'd'
                ProjectName = newProject.ProjectName,
                Description = newProject.Description,
                CreatedAt = newProject.CreatedAt.Value, // .Value (null değil)
                OwnerUserId = newProject.OwnerUserId   // Küçük 'd'
            };

            return CreatedAtAction(nameof(GetProjectById), new { id = newProject.ProjectId }, projectToReturn);
        }

        // GET: api/projects/{id}
        // Bu metot, tüm panoyu (Proje, Listeleri ve Kartları) getirir
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            // 1. Güvenlik: Token'dan Kullanıcı ID'sini Oku
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            // 2. Veritabanından Projeyi Çek (İlgili Listeleri ve Görevleri DAHİL EDEREK)
            // Bu, Entity Framework'ün "Eager Loading" özelliğidir
            var project = await _context.Projects
                .Include(p => p.Lists) // Projeye ait Listeleri de yükle
                    .ThenInclude(l => l.Tasks) // Listelere ait Görevleri (Task) de yükle
                .Where(p => p.ProjectId == id)
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound("Proje bulunamadı.");
            }

            // 3. Güvenlik: Projenin sahibi bu kullanıcı mı?
            if (project.OwnerUserId != userId)
            {
                return Forbid("Bu projeyi görme yetkiniz yok.");
            }

            // 4. "Temiz" Pano DTO'sunu oluştur (500 Sonsuz Döngü Hatasını önle)
            // Bu, veritabanından çektiğimiz verileri "manuel" olarak temiz DTO'lara dönüştürme işlemidir
            var projectBoardDto = new ProjectDto // (ProjectDto'yu ana DTO olarak kullanabiliriz)
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName,
                Description = project.Description,
                CreatedAt = project.CreatedAt.Value,
                OwnerUserId = project.OwnerUserId
            };

            // Şimdi Listeleri ve Görevleri dönüştürelim
            var listsDto = project.Lists.Select(l => new ListWithTasksDto
            {
                ListId = l.ListId,
                ListName = l.ListName,
                Order = l.Order,
                Tasks = l.Tasks.Select(t => new TaskDto // Her listenin içindeki görevleri de dönüştür
                {
                    TaskId = t.TaskId,
                    Title = t.Title,
                    Description = t.Description,
                    Order = t.Order,
                    ListId = t.ListId
                }).OrderBy(t => t.Order).ToList() // Görevleri kendi içinde sırala
            }).OrderBy(l => l.Order).ToList(); // Listeleri (Kolonları) kendi içinde sırala


            // 5. Cevabı birleştirelim (Bu, geçici bir anonim nesne)
            // DTO'ları ayrı ayrı oluşturduğumuz için, bunları birleştirip gönderiyoruz
            var response = new
            {
                Project = projectBoardDto,
                Lists = listsDto
            };

            return Ok(response); // "Temiz" Pano verisini döndür
        }

        // GET: api/projects
        [HttpGet]
        public async Task<IActionResult> GetMyProjects()
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized("Token'dan Kullanıcı ID'si okunamadı.");
            }
            int userId = int.Parse(userIdString);

            var projects = await _context.Projects
                .Where(p => p.OwnerUserId == userId) // DOĞRU İSİM (Küçük 'd')
                .Select(p => new ProjectDto
                {
                    ProjectId = p.ProjectId,     // Küçük 'd'
                    ProjectName = p.ProjectName,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt.Value, // .Value (null değil)
                    OwnerUserId = p.OwnerUserId   // Küçük 'd'
                })
                .ToListAsync();

            return Ok(projects);
        }
    }
}