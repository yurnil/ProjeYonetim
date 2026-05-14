using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjeYonetim.API.Data;
using ProjeYonetim.API.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly ProjeYonetimContext _context;
    public NotificationController(ProjeYonetimContext context) { _context = context; }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20).ToListAsync();
        return Ok(notifications);
    }

    [HttpPut("mark-as-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var unread = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        unread.ForEach(n => n.IsRead = true);
        await _context.SaveChangesAsync();
        return Ok();
    }
}