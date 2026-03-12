---
sidebar_position: 6
---

# 系统命令

用于获取系统信息和全局配置的命令。

## get_system_info

返回宿主系统信息。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_system_info","id":1}
← {"jsonrpc":"2.0","result":{
  "os_platform": "windows",
  "os_version": "10.0.22631",
  "os_build": "22631",
  "arch": "x86_64"
},"id":1}
```
