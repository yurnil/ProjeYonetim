using Microsoft.EntityFrameworkCore;
using ProjeYonetim.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjeYonetim.API.Data
{
    public static class DbSeeder
    {
 
        public static async System.Threading.Tasks.Task SeedAsync(ProjeYonetimContext context, string yourEmail)
        {
 
            var myUser = await context.Users.FirstOrDefaultAsync(u => u.Email == yourEmail);

 
            if (myUser == null) return;
            bool projectExists = await context.Projects.AnyAsync(p =>
        p.OwnerUserId == myUser.UserId &&
        p.ProjectName == "Akdeniz Üni - Akıllı Kampüs");

            if (projectExists) return;

           
            var sampleProject = new Project
            {
                ProjectName = "Akdeniz Üni - Akıllı Kampüs",
                Description = "Bu proje otomatik olarak DbSeeder tarafından senin hesabına tanımlandı.",
                OwnerUserId = myUser.UserId,
                CreatedAt = DateTime.Now.AddDays(-2) 
            };
            context.Projects.Add(sampleProject);
            await context.SaveChangesAsync();

            var list1 = new List { ListName = "Yapılacaklar", Order = 1, ProjectId = sampleProject.ProjectId };
            var list2 = new List { ListName = "Devam Edenler", Order = 2, ProjectId = sampleProject.ProjectId };
            context.Lists.AddRange(list1, list2);
            await context.SaveChangesAsync();


            var task1 = new ProjeYonetim.API.Models.Task
            {
                Title = "Sunum Dosyası Hazırla",
                ListId = list1.ListId,
                Order = 1,
                Label = "Sunum",
                Priority = "Yüksek",
                Description = "Projenin tüm özelliklerini anlatan bir PDF hazırlanacak."
            };

            var task2 = new ProjeYonetim.API.Models.Task
            {
                Title = "Giriş Ekranı Bug Fix", 
                ListId = list2.ListId,
                Order = 1,
                Label = "Frontend",
                Priority = "Orta"
            };

            context.Tasks.AddRange(task1, task2);
            await context.SaveChangesAsync();


            context.Comments.Add(new Comment
            {
                Text = "Bu görevi hafta sonuna kadar bitirebiliriz.",
                TaskId = task1.TaskId,
                UserId = myUser.UserId
            });

            await context.SaveChangesAsync();
        }
    }
}