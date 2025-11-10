using System;

namespace ProjeYonetim.API.DTOs
{
    public class ProjectDto
    {
        public int ProjectId { get; set; } // Küçük 'd'
        public string ProjectName { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } // Boş olamaz
        public int OwnerUserId { get; set; } // Küçük 'd'
    }
}