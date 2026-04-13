using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Data;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;


namespace ProjeYonetim.API.Controllers
{
    [Authorize] 
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public MessagesController(ProjeYonetimContext context)
        {
            _context = context;
        }

      
        [HttpGet("history/{contactId}")]
        public async Task<IActionResult> GetChatHistory(int contactId)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var messages = await _context.Messages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == contactId) ||
                            (m.SenderId == contactId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.Timestamp) 
                .Select(m => new { m.Id, m.Content, m.SenderId, m.ReceiverId }) 
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("contacts")]
        public async Task<IActionResult> GetContacts()
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

           
            var myProjectIds = await _context.Projects
                .Where(p => p.OwnerUserId == currentUserId || p.ProjectCollaborators.Any(pc => pc.UserId == currentUserId))
                .Select(p => p.ProjectId) 
                .ToListAsync();

            
            var users = await _context.Users
                .Where(u => u.UserId != currentUserId && 
                            _context.Projects.Any(p => myProjectIds.Contains(p.ProjectId) &&
                                                      (p.OwnerUserId == u.UserId || p.ProjectCollaborators.Any(pc => pc.UserId == u.UserId))))
                .Select(u => new { UserId = u.UserId, FullName = u.FullName ?? u.Email,
                UnreadCount = _context.Messages.Count(m => m.SenderId == u.UserId && m.ReceiverId == currentUserId && m.IsRead == false)
                })
                .Distinct() 
                .ToListAsync();

            return Ok(new { CurrentUserId = currentUserId, Users = users });
        }

        [HttpPut("mark-read/{senderId}")]
        public async Task<IActionResult> MarkAsRead(int senderId)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var unreadMessages = await _context.Messages
                .Where(m => m.SenderId == senderId && m.ReceiverId == currentUserId && m.IsRead == false)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Okundu olarak işaretlendi." });
        }
    }
}