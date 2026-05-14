using System;

namespace ProjeYonetim.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; } 
        public string Message { get; set; } = null!; 
        public string Type { get; set; } = null!; 
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? TargetUrl { get; set; } 
    }
}