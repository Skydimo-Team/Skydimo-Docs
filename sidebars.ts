import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'guide/architecture',
        'guide/features',
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
      ],
    },
    'api/events',
    'api/data-types',
  ],
  pluginsSidebar: [
    'plugins/overview',
    'plugins/getting-started',
    'plugins/manifest',
    {
      type: 'category',
      label: 'Plugin Types',
      items: [
        'plugins/controller-plugin',
        'plugins/effect-plugin',
        'plugins/extension-plugin',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'plugins/api/controller-api',
        'plugins/api/effect-api',
        'plugins/api/extension-api',
      ],
    },
    'plugins/permissions',
    'plugins/i18n',
  ],
};

export default sidebars;
