using System.Collections.Generic;

namespace ProjeYonetim.API.DTOs
{
    // Bu, bir "Liste Kolonu"nun ve İÇİNDEKİ KARTLARIN temiz halidir
    public class ListWithTasksDto
    {
        public int ListId { get; set; }
        public string ListName { get; set; }
        public int Order { get; set; } // Kolonun pano içindeki sırası

        //Bu DTO, içinde "temiz" TaskDto'ların bir listesini tutar
        public List<TaskDto> Tasks { get; set; } = new List<TaskDto>();
    }
}