using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.DTOs;
using ProjeYonetim.API.Models;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")] // Adres: /api/lists
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] // GÜVENLİ
    public class ListsController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public ListsController(ProjeYonetimContext context)
        {
            _context = context;
        }

        // POST: api/lists
        // Yeni bir liste (kolon) oluşturur
        [HttpPost]
        public async Task<IActionResult> CreateList([FromBody] ListCreateDto listDto)
        {
            // 1. Token'dan Kullanıcı ID'sini Oku
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            // 2. Güvenlik: Bu kullanıcı, liste eklemek istediği projenin sahibi mi?
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == listDto.ProjectId && p.OwnerUserId == userId);

            if (project == null)
            {
                // Ya proje yok ya da proje başkasına ait
                return Forbid("Bu projeye liste ekleme yetkiniz yok veya proje bulunamadı.");
            }

            // 3. Yeni listenin sırasını (Order) belirle
            // O projeye ait mevcut listelerin sayısına bakıyoruz
            int currentListCount = await _context.Lists
                .CountAsync(l => l.ProjectId == listDto.ProjectId);

            int newOrder = currentListCount + 1; // Yeni listeyi en sona ekle

            // 4. Yeni Liste Nesnesini Oluştur
            var newList = new List
            {
                ListName = listDto.ListName,
                ProjectId = listDto.ProjectId,
                Order = newOrder
            };

            // 5. Veritabanına Ekle ve Kaydet
            _context.Lists.Add(newList);
            await _context.SaveChangesAsync();

            // 6. "Temiz" DTO'yu oluştur (500 Sonsuz Döngü Hatasını önle)
            var listToReturn = new ListDto
            {
                ListId = newList.ListId,
                ListName = newList.ListName,
                Order = newList.Order,
                ProjectId = newList.ProjectId
            };

            // 7. Başarılı cevabı dön (201 Created)
            return CreatedAtAction(nameof(GetListById), new { id = newList.ListId }, listToReturn);
        }


        // (Yukarıdaki 'CreatedAtAction'ın çalışması için geçici bir 'Get' metodu)
        // GET: api/lists/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListById(int id)
        {
            var list = await _context.Lists.FindAsync(id);
            if (list == null)
            {
                return NotFound();
            }

            // (Bu metot sadece 'CreatedAtAction' için bir yer tutucudur,
            //  daha sonra detaylı bir güvenlik kontrolü eklenebilir)

            // "Temiz" DTO'yu döndür
            var listToReturn = new ListDto
            {
                ListId = list.ListId,
                ListName = list.ListName,
                Order = list.Order,
                ProjectId = list.ProjectId
            };
            return Ok(listToReturn);
        }
    }
}