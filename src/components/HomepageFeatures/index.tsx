import type {ReactNode} from 'react';
import clsx from 'clsx';
import Translate, {translate} from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: translate({id: 'homepage.feature.lua.title', message: 'Lua Plugin System'}),
    description: (
      <Translate id="homepage.feature.lua.description">
        {'Extend Skydimo with Lua plugins — create custom lighting effects, hardware drivers, and background services without recompiling. The plugin system supports controllers, effects, and extensions.'}
      </Translate>
    ),
  },
  {
    title: translate({id: 'homepage.feature.crossPlatform.title', message: 'Cross-Platform'}),
    description: (
      <Translate id="homepage.feature.crossPlatform.description">
        {'Runs on Windows, macOS, and Linux. The Rust core provides native performance with USB hot-plug detection, screen capture, and audio analysis on every platform.'}
      </Translate>
    ),
  },
  {
    title: translate({id: 'homepage.feature.websocket.title', message: 'WebSocket API'}),
    description: (
      <Translate id="homepage.feature.websocket.description">
        {'Full JSON-RPC 2.0 API over WebSocket. Build custom UIs, integrate with home automation, or control your lighting programmatically from any language.'}
      </Translate>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{paddingTop: '2rem'}}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
