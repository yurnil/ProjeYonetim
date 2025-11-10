namespace ProjeYonetim.API.DTOs
{
    // Bu, bir "Görev Kartı"nın temiz halidir
    public class TaskDto
    {
        public int TaskId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public int Order { get; set; } // Kartın liste içindeki sırası
        public int ListId { get; set; }
    }
}