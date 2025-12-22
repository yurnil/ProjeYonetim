using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjeYonetim.API.Models
{
    public class Project
    {
        [Key]
        public int ProjectId { get; set; }

        public string ProjectName { get; set; }

        public string Description { get; set; }


        public DateTime? CreatedAt { get; set; } = DateTime.Now;

        public int OwnerUserId { get; set; }

        [ForeignKey("OwnerUserId")]
        public virtual User OwnerUser { get; set; }

        public virtual ICollection<List> Lists { get; set; }

        public virtual ICollection<ProjectCollaborator> ProjectCollaborators { get; set; }
    }
}