using System.ComponentModel.DataAnnotations;
namespace ProjeYonetim.API.DTOs
{
    public class RegisterDto
    {
        [Required] public string FullName { get; set; }
        [Required][EmailAddress] public string Email { get; set; }
        [Required][MinLength(6)] public string Password { get; set; }
    }
}