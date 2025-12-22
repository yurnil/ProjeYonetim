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
using System.Collections.Generic;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TasksController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public TasksController(ProjeYonetimContext context)
        {
            _context = context;
        }


        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto taskDto)
        {

            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Oturum hatası.");
            int userId = int.Parse(userIdString);


            var list = await _context.Lists
                .Include(l => l.Project)
                .FirstOrDefaultAsync(l => l.ListId == taskDto.ListId);

            if (list == null) return NotFound("Liste bulunamadı.");

            if (list.Project.OwnerUserId != userId)
            {

            }

            int currentTaskCount = await _context.Tasks.CountAsync(t => t.ListId == taskDto.ListId);

            var newTask = new ProjeYonetim.API.Models.Task
            {
                Title = taskDto.Title,
                Description = taskDto.Description ?? "", 
                ListId = taskDto.ListId,
                Order = currentTaskCount + 1,
                Priority = "Normal",      
                Label = "Yok",            
                CreatedAt = DateTime.Now  
            };

            _context.Tasks.Add(newTask);
            await _context.SaveChangesAsync();


            return Ok(new
            {
                TaskId = newTask.TaskId,
                Title = newTask.Title,
                ListId = newTask.ListId,
                Priority = newTask.Priority
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            var taskToDelete = await _context.Tasks
                .Include(t => t.List)
                .ThenInclude(l => l.Project)
                .FirstOrDefaultAsync(t => t.TaskId == id);

            if (taskToDelete == null) return NotFound("Görev bulunamadı.");

            if (taskToDelete.List.Project.OwnerUserId != userId)
            {
                return Forbid("Bu görevi silme yetkiniz yok.");
            }

            _context.Tasks.Remove(taskToDelete);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Görev silindi." });
        }

        [HttpGet("{taskId}/comments")]
        public async Task<IActionResult> GetComments(int taskId)
        {
            var comments = await _context.Comments
                .Where(c => c.TaskId == taskId)
                .Include(c => c.User)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.CommentId,
                    c.Text,
                    c.CreatedAt,
                    UserName = c.User.FullName
                })
                .ToListAsync();

            return Ok(comments);
        }


        [HttpPost("comments")]
        public async Task<IActionResult> AddComment([FromBody] CommentDto dto)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            var comment = new Comment
            {
                Text = dto.Text,
                TaskId = dto.TaskId,
                UserId = userId,
                CreatedAt = System.DateTime.Now
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Yorum eklendi." });
        }


        [HttpPut("{taskId}/assign/{userId}")]
        public async Task<IActionResult> AssignUser(int taskId, int userId)
        {
            var requesterIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int requesterId = int.Parse(requesterIdString);

            var task = await _context.Tasks
                .Include(t => t.List)
                .ThenInclude(l => l.Project)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);

            if (task == null) return NotFound("Görev bulunamadı.");

            if (task.List.Project.OwnerUserId != requesterId)
            {
                return StatusCode(403, "Sadece proje sahibi görev ataması yapabilir.");
            }

            task.AssignedUserId = userId == 0 ? (int?)null : userId;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Atama güncellendi." });
        }


        [HttpPut("{taskId}/label")]
        public async Task<IActionResult> UpdateLabel(int taskId, [FromBody] string label)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int currentUserId = int.Parse(userIdString);

            var task = await _context.Tasks
                .Include(t => t.List)
                .ThenInclude(l => l.Project)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);

            if (task == null) return NotFound("Görev bulunamadı.");

            if (task.List.Project.OwnerUserId != currentUserId)
            {
                return StatusCode(403, "Sadece proje sahibi etiket değiştirebilir.");
            }

            task.Label = label;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Etiket güncellendi." });
        }


        [HttpPut("{taskId}/move")]
        public async Task<IActionResult> MoveTask(int taskId, [FromBody] TaskMoveDto moveDto)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return NotFound("Görev bulunamadı.");

            task.ListId = moveDto.TargetListId;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Görev taşındı." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskUpdateDto taskDto)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            var task = await _context.Tasks
                .Include(t => t.List)
                .ThenInclude(l => l.Project)
                .FirstOrDefaultAsync(t => t.TaskId == id);

            if (task == null) return NotFound("Görev bulunamadı.");


            if (task.List.Project.OwnerUserId != userId)
            {
                return Forbid("Bu kartı düzenleme yetkiniz yok.");
            }


            task.Title = taskDto.Title;
            task.Description = taskDto.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Kart güncellendi." });
        }

        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderTasks([FromBody] TaskReorderDto reorderDto)
        {
           
            var tasks = await _context.Tasks.Where(t => t.ListId == reorderDto.ListId).ToListAsync();


            for (int i = 0; i < reorderDto.TaskIds.Count; i++)
            {
                var task = tasks.FirstOrDefault(t => t.TaskId == reorderDto.TaskIds[i]);
                if (task != null)
                {
                    task.Order = i;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Sıralama güncellendi." });
        }
        public class TaskReorderDto
        {
            public int ListId { get; set; }
            public List<int> TaskIds { get; set; }
        }
        public class TaskUpdateDto
        {
            public string Title { get; set; }
            public string Description { get; set; }
        }
    }
}