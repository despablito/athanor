import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'concepts/three-layers',
        'concepts/chunk-anatomy',
        'concepts/relations',
        'concepts/meta-chunks',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/installation',
        'guides/portrait-lifecycle',
        'guides/first-portrait',
        'guides/self-portrait',
        'guides/ai-extraction',
        'guides/deploying-clone',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/core',
        'api/extractor',
        'api/clone-api',
        'api/mcp-server',
      ],
    },
    'philosophy',
  ],
};

export default sidebars;
