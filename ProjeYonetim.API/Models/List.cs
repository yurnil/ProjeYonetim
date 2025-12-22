using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProjeYonetim.API.Models;

public partial class List
{
    [Key]
    [Column("ListID")]
    public int ListId { get; set; }

    [StringLength(100)]  
    public string ListName { get; set; } = null!;

    public int Order { get; set; }

    [Column("ProjectID")]
    public int ProjectId { get; set; }

    [ForeignKey("ProjectId")]
    [InverseProperty("Lists")]
    public virtual Project Project { get; set; } = null!;

    [InverseProperty("List")]
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}
