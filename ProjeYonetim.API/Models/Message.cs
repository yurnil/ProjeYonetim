using ProjeYonetim.API.Models;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;
    public bool IsRead { get; set; } = false;

    
    public int SenderId { get; set; }
    public User Sender { get; set; }

    public int ReceiverId { get; set; }
    public User Receiver { get; set; }
}