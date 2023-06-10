#pragma warning disable CA1416 // Validate platform compatibility

using ImageFragments.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Drawing;
using System.Drawing.Imaging;

namespace ImageFragments.Controllers
{
    [Route("image")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        const int Width = 1600;
        const int Height = 1200;

        // Контекст хаба SignalR
        private readonly IHubContext<FragmentHub> _hubContext;

        public ImageController(IHubContext<FragmentHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [Route("fragments/{rows}/{cols}")]
        [HttpPost]
        public async Task<IActionResult> GetFragments(int rows, int cols)
        {
            IFormFile file = Request.Form.Files[0];

            int fragmentWidth = Width / cols;
            int fragmentHeight = Height / rows;

            var fragments = new List<string>();
            using (var image = Image.FromStream(file.OpenReadStream()))
            {
                for (int i = 0; i < rows; i++)
                {
                    for (int j = 0; j < cols; j++)
                    {
                        int x = j * fragmentWidth;
                        int y = i * fragmentHeight;

                        using (var fragment = new Bitmap(fragmentWidth, fragmentHeight))
                        {
                            using (var graphics = Graphics.FromImage(fragment))
                            {
                                graphics.DrawImage(image, new Rectangle(0, 0, fragmentWidth, fragmentHeight), new Rectangle(x, y, fragmentWidth, fragmentHeight), GraphicsUnit.Pixel);
                                graphics.DrawString($"{x}, {y}", new Font("Calibri", 14), Brushes.Black, new PointF(0, 0));
                            }
                            string fragmentBase64 = ConvertImageToBase64(fragment);
                            fragments.Add(fragmentBase64);

                            await _hubContext.Clients.All.SendAsync("ReceiveFragment", fragmentBase64);
                            
                            // For see loading
                            await Task.Delay(10);
                        }
                    }
                }
            }
            return Ok("It's WORK!");
        }

        private string ConvertImageToBase64(Image image)
        {
            using (var memoryStream = new MemoryStream())
            {
                image.Save(memoryStream, ImageFormat.Jpeg);
                byte[] imageBytes = memoryStream.ToArray();
                return Convert.ToBase64String(imageBytes);
            }
        }
    }
}
