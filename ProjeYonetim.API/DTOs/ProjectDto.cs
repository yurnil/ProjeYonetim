using System;

namespace ProjeYonetim.API.DTOs
{
    public class ProjectDto
    {
        public int ProjectId { get; set; } 
        public string ProjectName { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } 
        public int OwnerUserId { get; set; }
    }
}