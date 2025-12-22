using System.Collections.Generic;

namespace ProjeYonetim.API.DTOs
{

    public class ListWithTasksDto
    {
        public int ListId { get; set; }
        public string ListName { get; set; } 
        public int Order { get; set; } 


        public List<TaskDto> Tasks { get; set; } = new List<TaskDto>();
    }
}