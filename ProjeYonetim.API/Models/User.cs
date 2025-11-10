using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProjeYonetim.API.Models;

[Index("Email", Name = "UQ__Users__A9D10534CB7A45D7", IsUnique = true)]
public partial class User
{
    [Key]
    [Column("UserId")]
    public int UserId { get; set; }

    [StringLength(100)]
    public string FullName { get; set; } = null!;

    [StringLength(255)]
    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    [StringLength(50)]
    public string Role { get; set; } = null!;

    public bool IsEnabled { get; set; }

    [InverseProperty("OwnerUser")]
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
}
