using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Models;

namespace ProjeYonetim.API.Data;

public partial class ProjeYonetimContext : DbContext
{
    public ProjeYonetimContext()
    {
    }

    public ProjeYonetimContext(DbContextOptions<ProjeYonetimContext> options)
        : base(options)
    {
    }

    public virtual DbSet<List> Lists { get; set; }
    public virtual DbSet<Project> Projects { get; set; }
    public DbSet<ProjeYonetim.API.Models.Task> Tasks { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public DbSet<ProjectCollaborator> ProjectCollaborators { get; set; }
    public DbSet<Comment> Comments { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<List>(entity =>
        {
            entity.HasKey(e => e.ListId).HasName("PK__Lists__E3832865F52DCBA5");
            entity.HasOne(d => d.Project).WithMany(p => p.Lists).HasConstraintName("FK_Lists_Projects");
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId).HasName("PK__Projects__761ABED0BC930C7A");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.OwnerUser).WithMany(p => p.Projects).HasConstraintName("FK_Projects_Users"); 
        });

        modelBuilder.Entity<Models.Task>(entity =>
        {
            entity.HasKey(e => e.TaskId).HasName("PK__Tasks__7C6949D1FC015EA2");
            entity.HasOne(d => d.List).WithMany(p => p.Tasks).HasConstraintName("FK_Tasks_Lists");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCAC14885B1C");
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);
            entity.Property(e => e.Role).HasDefaultValue("User");
        });

        modelBuilder.Entity<ProjectCollaborator>(entity =>
        {
            entity.HasOne(pc => pc.User)
                  .WithMany()
                  .HasForeignKey(pc => pc.UserId)
                  .OnDelete(DeleteBehavior.Restrict); 
        });

    
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Restrict); 
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}