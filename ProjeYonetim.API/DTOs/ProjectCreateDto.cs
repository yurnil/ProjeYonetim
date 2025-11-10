using System.ComponentModel.DataAnnotations;
namespace ProjeYonetim.API.DTOs
{
    public class ProjectCreateDto
    {
        [Required][StringLength(200)] public string ProjectName { get; set; }
        [StringLength(1000)] public string? Description { get; set; }
    }
}