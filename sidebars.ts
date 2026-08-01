import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  userGuideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'First Steps',
      items: [
        'user-guide/overview',
        'user-guide/editions',
        'user-guide/getting-started',
      ],
    },
    {
      type: 'category',
      label: 'Devices and Lighting',
      items: [
        'user-guide/device-control',
        'user-guide/led-layout',
      ],
    },
    {
      type: 'category',
      label: 'App Management',
      items: [
        'user-guide/plugin-management',
        'user-guide/settings',
      ],
    },
    {
      type: 'category',
      label: 'Support',
      items: [
        'user-guide/troubleshooting',
      ],
    },
  ],
  knowledgeBaseSidebar: [
    {
      type: 'category',
      label: 'Project Overview',
      items: [
        'knowledge-base/overview',
        'guide/features',
        'guide/architecture',
      ],
    },
    {
      type: 'category',
      label: 'System Internals',
      items: [
        'knowledge-base/system-architecture',
        'knowledge-base/state-and-rendering',
        'knowledge-base/frontend-architecture',
        'knowledge-base/plugin-system',
      ],
    },
    {
      type: 'category',
      label: 'Working in the Repository',
      items: [
        'knowledge-base/codebase-map',
        'knowledge-base/development-workflow',
      ],
    },
  ],
  apiSidebar: [
    'api/websocket-overview',
    {
      type: 'category',
      label: 'Commands',
      items: [
        'api/commands/devices',
        'api/commands/effects',
        'api/commands/screen-audio',
        'api/commands/plugins',
        'api/commands/system',
        'api/commands/runtime-diagnostics',
      ],
    },
    'api/events',
    'api/data-types',
  ],
  pluginsSidebar: [
    'plugins/overview',
    'plugins/getting-started',
    'plugins/plugin-management',
    'plugins/manifest',
    'plugins/native-c-plugin',
    {
      type: 'category',
      label: 'Plugin Types',
      items: [
        'plugins/controller-plugin',
        'plugins/effect-plugin',
        'plugins/extension-plugin',
        'plugins/native-c-plugin',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'plugins/api/controller-api',
        'plugins/api/effect-api',
        'plugins/api/extension-api',
        'plugins/api/native-c-api',
      ],
    },
    'plugins/permissions',
    'plugins/i18n',
  ],
};

export default sidebars;
