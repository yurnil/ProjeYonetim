using System.ComponentModel.DataAnnotations;

namespace ProjeYonetim.API.DTOs
{
    public class TaskCreateDto
    {
        [Required(ErrorMessage = "Görev başlığı zorunludur.")]
        [StringLength(255)]
        public string Title { get; set; }

        [StringLength(2000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Liste ID'si zorunludur.")]
        public int ListId { get; set; }
    }
}