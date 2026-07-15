using System;

namespace InMemoryQueue;

public class Message<T>
{
    public string Id { get; } = Guid.NewGuid().ToString();
    public T Payload { get; }
    public int RetryCount { get; set; } = 0;
    public Exception? LastException { get; set; }

    public Message(T payload)
    {
        Payload = payload;
    }
}