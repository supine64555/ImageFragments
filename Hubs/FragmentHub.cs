using Microsoft.AspNetCore.SignalR;

namespace ImageFragments.Hubs
{
    public class FragmentHub : Hub
    {
        public async Task SendFragment(string message)
        {
            await Clients.All.SendAsync("ReceiveFragment", message);
        }
    }
}
