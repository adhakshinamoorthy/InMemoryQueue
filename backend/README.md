# ⚙️ .NET Queue Engine Core

This folder contains the high-throughput, asynchronous background ingestion and routing infrastructure utilizing C# `.NET Core` channels.

## 🏗️ Technical Specifications

- **Core Transport Architecture:** Double-bounded asynchronous memory channel blocks handled by `System.Threading.Channels.Channel`.
- **State Notifications Engine:** Direct, non-blocking asynchronous UI channel pipeline providing pure event streaming safely decoupled from synchronous standard C# events.
- **Resilience Modeling:** Custom decoupled asynchronous execution engine providing progressive exponential backoff math scaled by standard full random jitter rules.

## 💾 Development Execution & Dependencies

To execute the backend service independently:

```bash
# Clean project metadata and dependencies
dotnet clean

# Restore packages and start the engine
dotnet run
```
