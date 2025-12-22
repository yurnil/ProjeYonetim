using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjeYonetim.API.Models
{
    public class Task
    {
        [Key]
        public int TaskId { get; set; } 

        public string Title { get; set; }

        public string Description { get; set; }


        public string Priority { get; set; } = "Normal";

        public int ListId { get; set; }

        public int Order { get; set; }

        public string Label { get; set; }

        public int? AssignedUserId { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("ListId")]
        public virtual List List { get; set; }
    }
}