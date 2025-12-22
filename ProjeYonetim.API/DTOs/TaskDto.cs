namespace ProjeYonetim.API.DTOs
{

    public class TaskDto
    {
        public int TaskId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; } 
        public int Order { get; set; }
        public int ListId { get; set; }
    }
}