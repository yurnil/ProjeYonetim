namespace ProjeYonetim.API.DTOs
{
    // Bu, kullanıcıya geri göndereceğimiz "temiz" liste modelidir
    public class ListDto
    {
        public int ListId { get; set; }
        public string ListName { get; set; }
        public int Order { get; set; }
        public int ProjectId { get; set; }
    }
}