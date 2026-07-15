using System.Threading.Channels;

namespace InMemoryQueue;

public class InMemoryChannelQueue<T>
{
    private readonly Channel<Message<T>> _mainChannel;
    private readonly Channel<Message<T>> _dlqChannel;
    private readonly Channel<(string Id, string Status, int Retries)> _uiUpdateChannel;

    public ChannelWriter<Message<T>> Writer => _mainChannel.Writer;
    public ChannelReader<Message<T>> Reader => _mainChannel.Reader;
    public ChannelWriter<Message<T>> DlqWriter => _dlqChannel.Writer;
    public ChannelReader<Message<T>> DlqReader => _dlqChannel.Reader;
    public ChannelReader<(string Id, string Status, int Retries)> UiReader => _uiUpdateChannel.Reader;

    public InMemoryChannelQueue(int capacity = 10000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleWriter = false,
            SingleReader = false
        };

        _mainChannel = Channel.CreateBounded<Message<T>>(options);
        _dlqChannel = Channel.CreateUnbounded<Message<T>>();
        _uiUpdateChannel = Channel.CreateUnbounded<(string, string, int)>();
    }

    public void NotifyStatus(string messageId, string status, int retryCount)
    {
        _uiUpdateChannel.Writer.TryWrite((messageId, status, retryCount));
    }
}