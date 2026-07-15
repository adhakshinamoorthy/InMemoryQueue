using System;
using System.Threading;
using System.Threading.Tasks;

namespace InMemoryQueue;

public class Consumer<T>
{
    private readonly InMemoryChannelQueue<T> _queue;
    private readonly Func<T, CancellationToken, Task> _handler;
    private readonly int _maxRetries;
    private readonly TimeSpan _baseDelay;
    private readonly Random _random = new();

    public Consumer(
        InMemoryChannelQueue<T> queue,
        Func<T, CancellationToken, Task> handler,
        int maxRetries = 3,
        TimeSpan? baseDelay = null)
    {
        _queue = queue;
        _handler = handler;
        _maxRetries = maxRetries;
        _baseDelay = baseDelay ?? TimeSpan.FromSeconds(1);
    }

    public async Task StartConsumingAsync(CancellationToken cancellationToken)
    {
        await foreach (var message in _queue.Reader.ReadAllAsync(cancellationToken))
        {
            try
            {
                _queue.NotifyStatus(message.Id, "Processing", message.RetryCount);
                await _handler(message.Payload, cancellationToken);
                _queue.NotifyStatus(message.Id, "Completed", message.RetryCount);
            }
            catch (Exception ex)
            {
                message.LastException = ex;
                await HandleFailureAsync(message, cancellationToken);
            }
        }
    }

    private async Task HandleFailureAsync(Message<T> message, CancellationToken cancellationToken)
    {
        if (message.RetryCount < _maxRetries)
        {
            message.RetryCount++;

            double factor = Math.Pow(2, message.RetryCount - 1);
            double maxBackoffMs = _baseDelay.TotalMilliseconds * factor;
            double jitteredDelayMs = _random.NextDouble() * maxBackoffMs;
            var delay = TimeSpan.FromMilliseconds(jitteredDelayMs);

            _queue.NotifyStatus(message.Id, $"Retrying (in {jitteredDelayMs:F0}ms)", message.RetryCount);

            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(delay, cancellationToken);
                    await _queue.Writer.WriteAsync(message, cancellationToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Error] Requeue failed: {ex.Message}");
                }
            }, cancellationToken);
        }
        else
        {
            await _queue.DlqWriter.WriteAsync(message, cancellationToken);
            _queue.NotifyStatus(message.Id, "DLQ", message.RetryCount);
        }
    }
}