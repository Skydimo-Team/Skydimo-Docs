---
sidebar_position: 7
---

# 运行时、诊断与遥测

用于识别当前连接的 Core 运行时、读取可恢复的设备诊断，以及管理遥测授权的命令。

## 运行时配置

### get_runtime_profile

返回当前 Core 进程启动时选定且运行期间不可变的配置。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_runtime_profile","id":1}
← {"jsonrpc":"2.0","result":"advanced","id":1}
```

返回值：

- `"advanced"`：完整 Core 运行时。
- `"simple"`：功能受限的简易 Core 运行时。

客户端可在 WebSocket 建立后的第一次请求中调用此命令，并拒绝连接到不符合预期的运行时配置。

---

## 设备诊断

### get_device_diagnostics

返回硬件发现过程中检测到的可恢复问题及其版本化快照。

**参数**：无

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

实际的 `LocalizedText.byLocale` 可能包含示例未列出的更多语言。

| 字段 | 类型 | 说明 |
|------|------|------|
| `revision` | integer | 仅在诊断列表变化时递增。查询响应与较新的事件发生竞态时，可据此丢弃旧响应。 |
| `diagnostics` | array | 当前诊断实例；空数组表示 Core 当前未发现可恢复的设备发现问题。 |
| `diagnostics[].id` | string | 一个诊断实例的稳定标识。 |
| `diagnostics[].code` | string | 当前原因的机器可读代码。 |
| `diagnostics[].severity` | string | 当前为 `"warning"`。 |
| `diagnostics[].title` | LocalizedText | 本地化摘要。 |
| `diagnostics[].description` | LocalizedText | 本地化说明。 |
| `diagnostics[].action` | object? | 可选语义操作。Core 发送可信主题，而不是任意 URL 或可执行文件路径。 |

当前会产生的代码为 `windows_ch340_driver_unhealthy` 和 `windows_ch340_com_unavailable`；对应操作为 `kind: "open_support_article"`、`topic: "ch340_driver"`。目前只有 Windows 会检测这些 CH340 问题；除非以后新增其他诊断，其他平台返回空快照。

[`device-diagnostics-changed`](../events#device-diagnostics-changed) 事件使用相同的报告结构。

---

## 遥测

遥测采用主动选择加入。授权状态和匿名安装标识保存在 Core 共享配置中，因此 simple 与 advanced 配置共用这份状态。

### get_telemetry_enabled

返回当前 Core 进程是否正在启用遥测收集。

```json
→ {"jsonrpc":"2.0","method":"get_telemetry_enabled","id":1}
← {"jsonrpc":"2.0","result":false,"id":1}
```

### get_telemetry_status

返回授权状态、关联标识、队列计数、上传诊断和当前生效的遥测传输配置。

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

示例中的生效配置为默认值。远程配置可以改变来源、主机、时间间隔、批大小和允许事件数等值。

顶层字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 当前是否正在启用遥测。 |
| `consentDecided` | boolean | 用户是否已明确回答遥测授权选择。 |
| `runId` | string | 当前 Core 进程本次运行的稳定标识。 |
| `sessionId` | string | 当前遥测/运行时会话标识。 |
| `distinctId` | string | 用于支持关联的匿名安装标识。 |
| `diagnostics` | object | 队列、上传、持久化和生效配置诊断。 |

诊断字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `memoryQueueLength`、`channelQueueLength`、`totalQueueLength` | integer | 当前内存队列深度。 |
| `persistedEventCount`、`persistedEventBytes`、`persistedExceptionCount` | integer | 待处理的磁盘遥测数据。 |
| `droppedEvents`、`evictedPersistedEvents`、`queueAdmissionFailures`、`filteredEvents`、`deduplicatedEvents` | integer | 累计丢失、过滤和去重计数。 |
| `uploadAttemptCount`、`uploadSuccessCount`、`consecutiveUploadFailures` | integer | 上传计数。 |
| `lastUploadAttemptAtUnixMs`、`lastUploadSuccessAtUnixMs`、`lastUploadErrorAtUnixMs`、`nextUploadRetryAtUnixMs` | integer \| null | Unix 毫秒格式的上传时间。 |
| `lastUploadBatchSize`、`currentRetryDelayMs` | integer \| null | 最近批大小和当前重试延迟。 |
| `lastUploadError` | string \| null | 最近一次上传错误文本。 |
| `lastUploadErrorKind` | string \| null | `timeout`、`connection`、`http_status` 或 `transport`。 |
| `uploadHistoryPersistenceEnabled` | boolean | 当前始终为 `true`。 |
| `lastConfigFetchAtUnixMs`、`lastConfigSuccessAtUnixMs`、`lastConfigErrorAtUnixMs`、`lastPersistErrorAtUnixMs` | integer \| null | Unix 毫秒格式的远程配置和持久化时间。 |
| `lastConfigError`、`lastPersistError` | string \| null | 最近一次远程配置或持久化错误。 |
| `configSource` | string | `local`、`cache` 或 `remote`。 |
| `configBootstrapUrl`、`ingestHost` | string | 生效的配置和数据接收端点。 |
| `flushIntervalSeconds`、`batchSize`、`refreshIntervalSeconds`、`allowedEventCount` | integer | 生效的批处理和远程配置值。 |

### set_telemetry_enabled

持久化用户选择、将授权标记为已决定、立即启用或停用遥测，并返回与 `get_telemetry_status` 相同的状态结构。

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

停用遥测会停止其后台任务，并清除待处理事件、异常报告和已持久化的上传诊断。

### report_frontend_exception

向 Core 遥测管线提交结构化前端异常。该命令不接受任意异常类型。

| 字段 | 类型 | 必填 | 限制与说明 |
|------|------|:----:|------------|
| `kind` | string | 是 | `window_error`、`unhandled_rejection`、`react_uncaught`、`react_caught` 或 `react_recoverable`。 |
| `message` | string | 是 | 截断到 4,096 个 UTF-8 字节。 |
| `reportId` | string | 否 | 用于对已接受报告去重的 UUID；无效值会被忽略。 |
| `errorName` | string | 否 | 截断到 128 字节。 |
| `stackTrace` | string | 否 | 截断到 32,768 字节。 |
| `location` | string | 否 | 截断到 4,096 字节。 |
| `reactComponentStack` | string | 否 | 截断到 32,768 字节。 |
| `stackChunkIds` | object | 否 | 最多 32 个文件名到 chunk ID 的条目；无效条目会被忽略。 |

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

`disposition` 的取值：

- `accepted`：已进入队列、已持久化，或相同有效 `reportId` 的报告之前已被接受。
- `disabled`：遥测未启用。
- `rate_limited`：被 Core 的重复或每分钟限额拒绝。
- `dropped`：既未进入队列也未持久化。
