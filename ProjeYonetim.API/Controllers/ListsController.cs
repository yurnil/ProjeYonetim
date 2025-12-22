using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Data;
using ProjeYonetim.API.DTOs;
using ProjeYonetim.API.Models;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")] 
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] 
    public class ListsController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public ListsController(ProjeYonetimContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateList([FromBody] ListCreateDto listDto)
        {

            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);


            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == listDto.ProjectId && p.OwnerUserId == userId);

            if (project == null)
            {

                return Forbid("Bu projeye liste ekleme yetkiniz yok veya proje bulunamadı.");
            }

            int currentListCount = await _context.Lists
                .CountAsync(l => l.ProjectId == listDto.ProjectId);

            int newOrder = currentListCount + 1; 
  
            var newList = new List
            {
                ListName = listDto.ListName,
                ProjectId = listDto.ProjectId,
                Order = newOrder
            };

            _context.Lists.Add(newList);
            await _context.SaveChangesAsync();

            var listToReturn = new ListDto
            {
                ListId = newList.ListId,
                ListName = newList.ListName,
                Order = newList.Order,
                ProjectId = newList.ProjectId
            };

            return CreatedAtAction(nameof(GetListById), new { id = newList.ListId }, listToReturn);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetListById(int id)
        {
            var list = await _context.Lists.FindAsync(id);
            if (list == null)
            {
                return NotFound();
            }


            var listToReturn = new ListDto
            {
                ListId = list.ListId,
                ListName = list.ListName,
                Order = list.Order,
                ProjectId = list.ProjectId
            };
            return Ok(listToReturn);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteList(int id)
        {

            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            var listToDelete = await _context.Lists
                .Include(l => l.Project) 
                .FirstOrDefaultAsync(l => l.ListId == id);

            if (listToDelete == null)
            {
                return NotFound("Liste bulunamadı.");
            }


            if (listToDelete.Project.OwnerUserId != userId)
            {
                return Forbid("Bu listeyi silme yetkiniz yok.");
            }


            int projectId = listToDelete.ProjectId;
            int orderOfDeletedList = listToDelete.Order;

            var listsToUpdate = await _context.Lists
                .Where(l => l.ProjectId == projectId && l.Order > orderOfDeletedList) 
                .ToListAsync();

            foreach (var list in listsToUpdate)
            {
                list.Order--; 
                _context.Lists.Update(list);
            }

            _context.Lists.Remove(listToDelete);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Liste (ve içindeki tüm görevler) başarıyla silindi." });
        }
    }
}