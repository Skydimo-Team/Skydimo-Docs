---
sidebar_position: 7
---

# Runtime, Diagnostics, Telemetry, and Member Authentication

Commands for identifying the connected Core runtime, reading recoverable device diagnostics, managing telemetry consent, and completing member authentication.

## Runtime Profile

### get_runtime_profile

Returns the immutable profile selected when the connected Core process started.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_runtime_profile","id":1}
← {"jsonrpc":"2.0","result":"advanced","id":1}
```

The result is:

- `"advanced"` for the full Core runtime.
- `"simple"` for the constrained simple runtime.

Clients can call this as their first request after opening a WebSocket and reject a connection to an unexpected profile.

---

## Device Diagnostics

### get_device_diagnostics

Returns the current versioned snapshot of recoverable issues found during hardware discovery.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_device_diagnostics","id":1}
← {"jsonrpc":"2.0","result":{
  "revision":2,
  "diagnostics":[
    {
      "id":"windows.ch340.1a86.7523",
      "code":"windows_ch340_com_unavailable",
      "severity":"warning",
      "title":{
        "raw":"Skydimo serial driver needs attention",
        "byLocale":{
          "en-US":"Skydimo serial driver needs attention",
          "zh-CN":"Skydimo 串口驱动需要处理"
        }
      },
      "description":{
        "raw":"Windows detected the Skydimo serial device, but no usable COM port is available yet. Check the driver, then scan again.",
        "byLocale":{
          "en-US":"Windows detected the Skydimo serial device, but no usable COM port is available yet. Check the driver, then scan again.",
          "zh-CN":"Windows 已检测到 Skydimo 串口设备，但尚未提供可用的 COM 端口。请检查驱动，然后重新扫描。"
        }
      },
      "action":{
        "kind":"open_support_article",
        "topic":"ch340_driver",
        "label":{
          "raw":"View driver guide",
          "byLocale":{
            "en-US":"View driver guide",
            "zh-CN":"查看驱动指南"
          }
        }
      }
    }
  ]
},"id":1}
```

`LocalizedText.byLocale` can contain additional locale entries beyond those shown in the example.

| Field | Type | Description |
|-------|------|-------------|
| `revision` | integer | Increases only when the diagnostics list changes. Use it to reject an older query response that races with a newer event. |
| `diagnostics` | array | Current diagnostic instances; an empty array means Core currently knows of no recoverable discovery issue. |
| `diagnostics[].id` | string | Stable identity for one diagnostic instance. |
| `diagnostics[].code` | string | Machine-readable current reason. |
| `diagnostics[].severity` | string | Currently `"warning"`. |
| `diagnostics[].title` | LocalizedText | Localized summary. |
| `diagnostics[].description` | LocalizedText | Localized explanation. |
| `diagnostics[].action` | object? | Optional semantic action. Core sends a trusted topic, not an arbitrary URL or executable path. |

Codes currently produced are `windows_ch340_driver_unhealthy` and `windows_ch340_com_unavailable`. The corresponding action has `kind: "open_support_article"` and `topic: "ch340_driver"`. These CH340 diagnostics are currently detected on Windows; other platforms return an empty snapshot unless additional diagnostics are added.

The [`device-diagnostics-changed`](../events#device-diagnostics-changed) event carries the same report shape.

---

## Telemetry

Telemetry is opt-in. Consent and the pseudonymous installation identifier are stored in the shared Core configuration, so they are shared by the simple and advanced profiles.

### get_telemetry_enabled

Returns whether telemetry collection is active in the running Core process.

```json
→ {"jsonrpc":"2.0","method":"get_telemetry_enabled","id":1}
← {"jsonrpc":"2.0","result":false,"id":1}
```

### get_telemetry_status

Returns consent state, correlation identifiers, queue counters, upload diagnostics, and the effective telemetry transport configuration.

```json
→ {"jsonrpc":"2.0","method":"get_telemetry_status","id":1}
← {"jsonrpc":"2.0","result":{
  "enabled":false,
  "consentDecided":false,
  "runId":"core-run-id",
  "sessionId":"telemetry-session-id",
  "distinctId":"pseudonymous-installation-id",
  "diagnostics":{
    "memoryQueueLength":0,
    "channelQueueLength":0,
    "totalQueueLength":0,
    "persistedEventCount":0,
    "persistedEventBytes":0,
    "persistedExceptionCount":0,
    "droppedEvents":0,
    "evictedPersistedEvents":0,
    "queueAdmissionFailures":0,
    "filteredEvents":0,
    "deduplicatedEvents":0,
    "uploadAttemptCount":0,
    "uploadSuccessCount":0,
    "consecutiveUploadFailures":0,
    "lastUploadAttemptAtUnixMs":null,
    "lastUploadBatchSize":null,
    "lastUploadSuccessAtUnixMs":null,
    "lastUploadError":null,
    "lastUploadErrorKind":null,
    "lastUploadErrorAtUnixMs":null,
    "nextUploadRetryAtUnixMs":null,
    "currentRetryDelayMs":null,
    "uploadHistoryPersistenceEnabled":true,
    "lastConfigFetchAtUnixMs":null,
    "lastConfigSuccessAtUnixMs":null,
    "lastConfigError":null,
    "lastConfigErrorAtUnixMs":null,
    "lastPersistError":null,
    "lastPersistErrorAtUnixMs":null,
    "configSource":"local",
    "configBootstrapUrl":"https://ingest.skydimo.com/telemetry/config/v1.json",
    "ingestHost":"https://ingest.skydimo.com",
    "flushIntervalSeconds":5,
    "batchSize":20,
    "refreshIntervalSeconds":21600,
    "allowedEventCount":31
  }
},"id":1}
```

The effective configuration values in this example are defaults. Remote configuration can change values such as the source, host, intervals, batch size, and allowed-event count.

Top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether telemetry is active now. |
| `consentDecided` | boolean | Whether the user has explicitly answered the consent choice. |
| `runId` | string | Stable identifier for the current Core process run. |
| `sessionId` | string | Current telemetry/runtime session identifier. |
| `distinctId` | string | Pseudonymous installation identifier used for support correlation. |
| `diagnostics` | object | Queue, upload, persistence, and effective-configuration diagnostics. |

Diagnostic fields:

| Fields | Type | Description |
|--------|------|-------------|
| `memoryQueueLength`, `channelQueueLength`, `totalQueueLength` | integer | Current in-memory queue depths. |
| `persistedEventCount`, `persistedEventBytes`, `persistedExceptionCount` | integer | Pending on-disk telemetry data. |
| `droppedEvents`, `evictedPersistedEvents`, `queueAdmissionFailures`, `filteredEvents`, `deduplicatedEvents` | integer | Cumulative loss, filtering, and deduplication counters. |
| `uploadAttemptCount`, `uploadSuccessCount`, `consecutiveUploadFailures` | integer | Upload counters. |
| `lastUploadAttemptAtUnixMs`, `lastUploadSuccessAtUnixMs`, `lastUploadErrorAtUnixMs`, `nextUploadRetryAtUnixMs` | integer \| null | Upload timestamps in Unix milliseconds. |
| `lastUploadBatchSize`, `currentRetryDelayMs` | integer \| null | Last batch size and current retry delay. |
| `lastUploadError` | string \| null | Last upload error text. |
| `lastUploadErrorKind` | string \| null | `timeout`, `connection`, `http_status`, or `transport`. |
| `uploadHistoryPersistenceEnabled` | boolean | Currently always `true`. |
| `lastConfigFetchAtUnixMs`, `lastConfigSuccessAtUnixMs`, `lastConfigErrorAtUnixMs`, `lastPersistErrorAtUnixMs` | integer \| null | Remote-config and persistence timestamps in Unix milliseconds. |
| `lastConfigError`, `lastPersistError` | string \| null | Last remote-config or persistence error. |
| `configSource` | string | `local`, `cache`, or `remote`. |
| `configBootstrapUrl`, `ingestHost` | string | Effective configuration and ingestion endpoints. |
| `flushIntervalSeconds`, `batchSize`, `refreshIntervalSeconds`, `allowedEventCount` | integer | Effective batching and remote-configuration values. |

### set_telemetry_enabled

Persists the choice, marks consent as decided, activates or deactivates telemetry immediately, and returns the same status shape as `get_telemetry_status`.

```json
→ {"jsonrpc":"2.0","method":"set_telemetry_enabled","params":{"enabled":true},"id":1}
← {"jsonrpc":"2.0","result":{
  "enabled":true,
  "consentDecided":true,
  "runId":"core-run-id",
  "sessionId":"telemetry-session-id",
  "distinctId":"pseudonymous-installation-id",
  "diagnostics":{ }
},"id":1}
```

Disabling telemetry stops its workers and clears pending event, exception, and persisted upload-diagnostic data.

### report_frontend_exception

Submits a structured frontend exception to Core's telemetry pipeline. The command does not accept arbitrary exception kinds.

| Field | Type | Required | Limits and description |
|-------|------|:--------:|------------------------|
| `kind` | string | yes | `window_error`, `unhandled_rejection`, `react_uncaught`, `react_caught`, or `react_recoverable`. |
| `message` | string | yes | Truncated to 4,096 UTF-8 bytes. |
| `reportId` | string | no | UUID used to deduplicate an already accepted report; invalid values are ignored. |
| `errorName` | string | no | Truncated to 128 bytes. |
| `stackTrace` | string | no | Truncated to 32,768 bytes. |
| `location` | string | no | Truncated to 4,096 bytes. |
| `reactComponentStack` | string | no | Truncated to 32,768 bytes. |
| `stackChunkIds` | object | no | Up to 32 filename-to-chunk-ID entries. Invalid entries are ignored. |

```json
→ {"jsonrpc":"2.0","method":"report_frontend_exception","params":{
  "reportId":"cc23a8a9-67b1-483a-a8c5-2ed7b1535541",
  "kind":"react_uncaught",
  "errorName":"TypeError",
  "message":"Cannot read properties of undefined",
  "stackTrace":"TypeError: ...",
  "location":"https://app.localhost/assets/index.js:10:20"
},"id":1}
← {"jsonrpc":"2.0","result":{"disposition":"accepted"},"id":1}
```

`disposition` is:

- `accepted`: queued, persisted, or already accepted under the same valid `reportId`.
- `disabled`: telemetry is not active.
- `rate_limited`: rejected by Core's duplicate or per-minute limits.
- `dropped`: neither queued nor persisted.

---

## Member Authentication

Member authentication uses Skydimo's member service. Core persists the client session under the shared configuration directory and never returns the client token over JSON-RPC.

### Member authentication state

`member_auth_get_state`, `member_auth_logout`, the `state` field returned by polling, and the `member-auth-changed` event use this shape:

```json
{
  "authenticated":true,
  "user":{
    "id":42,
    "username":"SkydimoUser",
    "email":"user@example.com",
    "avatarUrl":"https://example.com/avatar.png",
    "isAdmin":false,
    "vipExpiresAt":null,
    "createdAt":"2026-01-01T00:00:00.000Z"
  },
  "expiresAt":1798761600,
  "offline":false,
  "message":null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `authenticated` | boolean | Whether a usable local member session exists. |
| `user` | object \| null | Member identity and account metadata. |
| `expiresAt` | integer \| null | Session expiration as Unix seconds. |
| `offline` | boolean | `true` when Core retains an existing session but could not refresh or persist it cleanly. |
| `message` | string \| null | Refresh, persistence, or service message intended for the client. |

### member_auth_get_state

Returns the cached local state. It does not perform a member-service request. If the stored session has expired, Core clears it and emits `member-auth-changed`.

```json
→ {"jsonrpc":"2.0","method":"member_auth_get_state","id":1}
← {"jsonrpc":"2.0","result":{
  "authenticated":false,
  "user":null,
  "expiresAt":null,
  "offline":false,
  "message":null
},"id":1}
```

### member_auth_start_login

Starts browser-based authorization and returns a request ID, URL, and lifetime in seconds.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `language` | string | no | `zh`, `zh-CN`, and `zh-TW` are normalized to `zh-CN`; other values use `en-US`. |

```json
→ {"jsonrpc":"2.0","method":"member_auth_start_login","params":{"language":"en-US"},"id":1}
← {"jsonrpc":"2.0","result":{
  "authRequestId":"request-id",
  "authUrl":"https://members.skydimo.com/...",
  "expiresIn":300
},"id":1}
```

### member_auth_poll_login

Polls a browser authorization request.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `authRequestId` | string | yes | Non-empty request ID of at most 64 characters. |

```json
→ {"jsonrpc":"2.0","method":"member_auth_poll_login","params":{
  "authRequestId":"request-id"
},"id":1}
← {"jsonrpc":"2.0","result":{
  "status":"pending",
  "state":{
    "authenticated":false,
    "user":null,
    "expiresAt":null,
    "offline":false,
    "message":null
  },
  "message":null
},"id":1}
```

Core handles `"pending"` and `"completed"` explicitly. Other status strings returned by the member service are passed through with the current cached state and service message. A completed authorization is validated, persisted, and followed by `member-auth-changed`.

### member_auth_logout

Attempts remote logout, clears the local session even if that remote request fails, emits `member-auth-changed`, and returns the signed-out state.

```json
→ {"jsonrpc":"2.0","method":"member_auth_logout","id":1}
← {"jsonrpc":"2.0","result":{
  "authenticated":false,
  "user":null,
  "expiresAt":null,
  "offline":false,
  "message":null
},"id":1}
```

Core also refreshes member state when the runtime starts and every 24 hours. Each background refresh emits [`member-auth-changed`](../events#member-auth-changed).
