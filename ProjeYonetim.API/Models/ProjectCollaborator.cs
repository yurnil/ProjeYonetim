using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjeYonetim.API.Models 
{
    public class ProjectCollaborator
    {
        [Key]
        public int Id { get; set; }


        public int ProjectId { get; set; }
        [ForeignKey("ProjectId")] 
        public Project Project { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}