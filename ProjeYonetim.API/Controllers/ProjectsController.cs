using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Data;
using ProjeYonetim.API.DTOs;
using ProjeYonetim.API.Models;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace ProjeYonetim.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ProjectsController : ControllerBase
    {
        private readonly ProjeYonetimContext _context;

        public ProjectsController(ProjeYonetimContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyProjects()
        {

            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
            int userId = int.Parse(userIdString);


            var myProjects = await _context.Projects
                .Where(p => p.OwnerUserId == userId)
                .ToListAsync();


            var collabProjects = await _context.ProjectCollaborators
                .Where(pc => pc.UserId == userId)
                .Include(pc => pc.Project)
                .Select(pc => pc.Project)
                .ToListAsync();


            var allProjects = myProjects.Concat(collabProjects)
                .Distinct() 
                .Select(p => new ProjectDto
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.ProjectName,
                    Description = p.Description,

                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    OwnerUserId = p.OwnerUserId
                })
                .OrderByDescending(p => p.CreatedAt)
                .ToList();

            return Ok(allProjects);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
            int userId = int.Parse(userIdString);

            var project = await _context.Projects
                .Include(p => p.OwnerUser)
                .Include(p => p.ProjectCollaborators)
                    .ThenInclude(pc => pc.User)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null) return NotFound("Proje bulunamadı.");

            bool isMember = project.ProjectCollaborators.Any(pc => pc.UserId == userId);
            if (project.OwnerUserId != userId && !isMember)
            {
                return StatusCode(403, "Bu projeyi görmeye yetkiniz yok.");
            }

            var lists = await _context.Lists
                .Where(l => l.ProjectId == id)
                .OrderBy(l => l.Order)
                .Select(l => new
                {
                    l.ListId,
                    l.ListName,
                    l.Order,
                    Tasks = l.Tasks.OrderBy(t => t.Order).Select(t => new
                    {
                        t.TaskId,
                        t.Title,
                        t.Description,
                        t.Label,
                        t.Priority,
                        t.DueDate,
                        t.AssignedUserId
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                project = new
                {
                    project.ProjectId,
                    project.ProjectName,
                    project.Description,
                    project.OwnerUserId,
                    OwnerName = project.OwnerUser?.FullName ?? "Bilinmiyor"
                },
                lists = lists,
                collaborators = project.ProjectCollaborators.Select(pc => new {
                    pc.User.UserId,
                    pc.User.FullName
                }).ToList()
            });
        }


        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateDto projectDto)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            int userId = int.Parse(userIdString);

            var newProject = new Project
            {
                ProjectName = projectDto.ProjectName,
                Description = projectDto.Description,
                OwnerUserId = userId,
                CreatedAt = DateTime.Now
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();

            var projectToReturn = new ProjectDto
            {
                ProjectId = newProject.ProjectId,
                ProjectName = newProject.ProjectName,
                Description = newProject.Description,

                CreatedAt = newProject.CreatedAt.GetValueOrDefault(),
                OwnerUserId = newProject.OwnerUserId
            };

            return CreatedAtAction(nameof(GetProject), new { id = newProject.ProjectId }, projectToReturn);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userIdString = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value; 
            int userId = int.Parse(userIdString);

            var project = await _context.Projects
                .Include(p => p.ProjectCollaborators)
                .Include(p => p.Lists)
                    .ThenInclude(l => l.Tasks)
                .FirstOrDefaultAsync(p => p.ProjectId == id);

            if (project == null) return NotFound("Proje bulunamadı.");

            if (project.OwnerUserId != userId) return Forbid();


            if (project.ProjectCollaborators != null) _context.ProjectCollaborators.RemoveRange(project.ProjectCollaborators);

            if (project.Lists != null)
            {
                foreach (var list in project.Lists)
                {
                    if (list.Tasks != null) _context.Tasks.RemoveRange(list.Tasks);
                }
                _context.Lists.RemoveRange(project.Lists);
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Silindi." });
        }

        [HttpPost("{projectId}/members")]
        public async Task<IActionResult> AddMember(int projectId, [FromBody] string email)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) return NotFound("Proje bulunamadı.");

            var userToAdd = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (userToAdd == null) return NotFound("Kullanıcı bulunamadı.");

            var exists = await _context.ProjectCollaborators
                .AnyAsync(pc => pc.ProjectId == projectId && pc.UserId == userToAdd.UserId);

            if (exists) return BadRequest("Zaten üye.");

            _context.ProjectCollaborators.Add(new ProjectCollaborator
            {
                ProjectId = projectId,
                UserId = userToAdd.UserId
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Üye eklendi." });
        }
    }
}