using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProjeYonetim.API.Models;

public partial class Task
{
    [Key]
    [Column("TaskID")]
    public int TaskId { get; set; }

    [StringLength(255)]
    public string Title { get; set; } = null!;

    [StringLength(2000)]
    public string? Description { get; set; }

    public int Order { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? DueDate { get; set; }

    [Column("ListID")]
    public int ListId { get; set; }

    [ForeignKey("ListId")]
    [InverseProperty("Tasks")]
    public virtual List List { get; set; } = null!;
}
