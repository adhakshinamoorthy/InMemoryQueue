using System.Threading;
using System.Threading.Tasks;

namespace InMemoryQueue;

public class Publisher<T>
{
    private readonly InMemoryChannelQueue<T> _queue;

    public Publisher(InMemoryChannelQueue<T> queue)
    {
        _queue = queue;
    }

    public async ValueTask PublishAsync(T payload, CancellationToken cancellationToken = default)
    {
        var message = new Message<T>(payload);
        await _queue.Writer.WriteAsync(message, cancellationToken);

        // Notify the UI channel that the item is queued!
        _queue.NotifyStatus(message.Id, "Queued", message.RetryCount);
    }
}