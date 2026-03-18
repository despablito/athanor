import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Athanor',
  tagline: 'Deep identity cloning through structured knowledge graphs',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://athanor.dev',
  baseUrl: '/',

  organizationName: 'anthropics',
  projectName: 'athanor',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/anthropics/athanor/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Athanor',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/anthropics/athanor',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'Introduction', to: '/docs/intro'},
            {label: 'Guides', to: '/docs/guides/installation'},
            {label: 'API Reference', to: '/docs/api/core'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'GitHub', href: 'https://github.com/anthropics/athanor'},
            {label: 'Protocol Spec', href: 'https://github.com/anthropics/athanor/blob/main/protocol/PROTOCOL.md'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Athanor Contributors. Apache 2.0 License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    // Algolia search — configure later with your own credentials
    // algolia: {
    //   appId: 'YOUR_APP_ID',
    //   apiKey: 'YOUR_SEARCH_API_KEY',
    //   indexName: 'athanor',
    // },
  } satisfies Preset.ThemeConfig,
};

export default config;
