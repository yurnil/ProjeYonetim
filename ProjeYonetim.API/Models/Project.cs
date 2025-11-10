using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProjeYonetim.API.Models;

public partial class Project
{
    [Key]
    [Column("ProjectID")]
    public int ProjectId { get; set; }

    [StringLength(200)]
    public string ProjectName { get; set; } = null!;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("OwnerUserID")]
    public int OwnerUserId { get; set; }

    [InverseProperty("Project")]
    public virtual ICollection<List> Lists { get; set; } = new List<List>();

    [ForeignKey("OwnerUserId")]
    [InverseProperty("Projects")]
    public virtual User OwnerUser { get; set; } = null!;
}
