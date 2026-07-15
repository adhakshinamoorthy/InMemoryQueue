using System.Text.Json;
using InMemoryQueue;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => options.AddPolicy("AllowReact",
    p => p.WithOrigins("http://localhost:5173", "http://localhost:3000")
          .AllowAnyMethod()
          .AllowAnyHeader()));

var queue = new InMemoryChannelQueue<string>(20);
builder.Services.AddSingleton(queue);
builder.Services.AddSingleton<Publisher<string>>();

var app = builder.Build();
app.UseCors("AllowReact");

var consumer = new Consumer<string>(queue, async (string payload, CancellationToken token) =>
{
    await Task.Delay(1000, token); // Simulate processing delay

    // Deterministic testing routes based on the input text
    string normalized = payload.ToUpper().Trim();

    if (normalized.Contains("FAIL") || normalized.Contains("DLQ"))
    {
        throw new Exception("Simulated database failure for testing DLQ routing.");
    }

    if (normalized.Contains("COMPLETED") || normalized.Contains("SUCCESS"))
    {
        return; // Succeeds immediately
    }

    // Fallback: Default to success if no keyword is matched
    return;
}, maxRetries: 3);

_ = Task.Run(() => consumer.StartConsumingAsync(CancellationToken.None));

app.MapPost("/api/publish", async (string payload, Publisher<string> pub) =>
{
    await pub.PublishAsync(payload);
    return Results.Ok(new { status = "Published" });
});

app.MapGet("/api/queue-stream", async (HttpContext ctx, InMemoryChannelQueue<string> q) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";
    ctx.Response.Headers.Connection = "keep-alive";

    var responseFeature = ctx.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
    responseFeature?.DisableBuffering();

    var cancellationToken = ctx.RequestAborted;

    try
    {
        // Immediate handshake so browser switches status badge to green
        await ctx.Response.WriteAsync("data: {\"init\":true}\n\n", cancellationToken);
        await ctx.Response.Body.FlushAsync(cancellationToken);

        await foreach (var update in q.UiReader.ReadAllAsync(cancellationToken))
        {
            // Explicit lowercase JSON string creation
            var json = $"{{\"id\":\"{update.Id}\",\"status\":\"{update.Status}\",\"retries\":{update.Retries},\"timestamp\":\"{DateTime.Now:HH:mm:ss}\"}}";
            await ctx.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
            await ctx.Response.Body.FlushAsync(cancellationToken);
        }
    }
    catch (OperationCanceledException) { }
});

app.Run();