---
sidebar_position: 6
---

# 系统命令

用于获取系统信息和全局配置的命令。

## get_system_info

返回宿主系统的详细信息，包括操作系统、主板、BIOS、CPU、GPU 和内存。

:::info 版本
扩展响应格式（主板、BIOS、CPU、GPU、内存）自 **3.0.0-dev.2** 起支持。早期版本仅返回 `osPlatform`、`osVersion`、`osBuild` 和 `arch`。
:::

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_system_info","id":1}
← {"jsonrpc":"2.0","result":{
  "os": {
    "platform": "Windows",
    "version": "Microsoft Windows 11 Pro",
    "build": "22631",
    "arch": "x86_64",
    "hostname": "MY-PC"
  },
  "motherboard": {
    "manufacturer": "ASUSTeK COMPUTER INC.",
    "model": "ROG STRIX B550-F GAMING",
    "product": "ROG STRIX B550-F GAMING",
    "serialNumber": "ABC123456"
  },
  "bios": {
    "vendor": "American Megatrends Inc.",
    "version": "2803",
    "date": "12/01/2023"
  },
  "cpu": {
    "name": "AMD Ryzen 9 5900X 12-Core Processor",
    "manufacturer": "AMD",
    "cores": 12,
    "threads": 24,
    "baseClockMhz": 3700,
    "architecture": "x64"
  },
  "gpu": [
    {
      "name": "NVIDIA GeForce RTX 3080",
      "manufacturer": "NVIDIA",
      "driverVersion": "537.58",
      "vramMb": 10240
    }
  ],
  "ram": {
    "totalMemoryMb": 32768,
    "modules": [
      {
        "manufacturer": "G Skill Intl",
        "partNumber": "F4-3600C16-16GVKC",
        "capacityMb": 16384,
        "speedMhz": 3600,
        "formFactor": "DIMM"
      }
    ]
  }
},"id":1}
```
