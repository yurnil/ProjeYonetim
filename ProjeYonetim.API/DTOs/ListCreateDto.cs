using System.ComponentModel.DataAnnotations;

namespace ProjeYonetim.API.DTOs
{
    public class ListCreateDto
    {
        [Required(ErrorMessage = "Liste adı zorunludur.")]
        [StringLength(100)]
        public string ListName { get; set; }

        [Required(ErrorMessage = "Proje ID'si zorunludur.")]
        public int ProjectId { get; set; }
    }
}