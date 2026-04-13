using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ProjeYonetim.API.Data;
using System;
using System.Threading.Tasks;
using ProjeYonetim.API.Data; 
using ProjeYonetim.API.Models;

namespace ProjeYonetim.API.Hubs
{
    [Authorize] 
    public class ChatHub : Hub
    {
        private readonly ProjeYonetimContext _context;

        public ChatHub(ProjeYonetimContext context)
        {
            _context = context;
        }


        public async System.Threading.Tasks.Task SendMessage(int receiverId, string content)
        {
            
            var senderIdString = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderIdString)) return;

            int senderId = int.Parse(senderIdString);

            
            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                Timestamp = DateTime.Now,
                IsRead = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            
            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", message);
        }
    }
}