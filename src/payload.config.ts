import { mongooseAdapter } from '@payloadcms/db-mongodb' // database-adapter-import

// import { payloadCloudPlugin } from '@payloadcms/plugin-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { LinkFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage as s3StoragePlugin } from '@payloadcms/storage-s3'
import sharp from 'sharp' // editor-import
import { UnderlineFeature } from '@payloadcms/richtext-lexical'
import { ItalicFeature } from '@payloadcms/richtext-lexical'
import { BoldFeature } from '@payloadcms/richtext-lexical'
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload/config'
import { revalidateRedirect } from 'src/payload/hooks/revalidateRedirect'
import { fileURLToPath } from 'url'

import Categories from './payload/collections/Categories'
import { Media } from './payload/collections/Media'
import { Pages } from './payload/collections/Pages'
import { Posts } from './payload/collections/Posts'
import Users from './payload/collections/Users'
// import BeforeDashboard from './payload/components/BeforeDashboard'
// import BeforeLogin from './payload/components/BeforeLogin'
import { seed } from './payload/endpoints/seed'
import { Footer } from './payload/globals/Footer/Footer'
import { Header } from './payload/globals/Header/Header'
import { S3_PLUGIN_CONFIG } from './payload/plugins/s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generateTitle = () => {
  return 'My Website'
}

dotenv.config({
  path: path.resolve(dirname, '../../.env'),
})

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: [],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: [],
    },
    user: Users.slug,
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        LinkFeature({
          enabledCollections: ['pages', 'posts'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
      ]
    },
  }),
  // database-adapter-config-start
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // database-adapter-config-end
  collections: [Pages, Posts, Media, Categories, Users],
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [
    // The seed endpoint is used to populate the database with some example data
    // You should delete this endpoint before deploying your site to production
    {
      handler: seed,
      method: 'get',
      path: '/seed',
    },
  ],
  globals: [Header, Footer],
  plugins: [
    s3StoragePlugin({
      ...S3_PLUGIN_CONFIG,
      collections: {
        media: {
          disableLocalStorage: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generateFileURL: (args: any) => {
            return `https://${process.env.NEXT_PUBLIC_S3_HOSTNAME}/${args.prefix}/${args.filename}`
          },
          prefix: process.env.NEXT_PUBLIC_UPLOAD_PREFIX || 'media',
        },
      },
    }),
    redirectsPlugin({
      collections: ['pages', 'posts'],
      overrides: {
        access: {
          read: () => false,
        },
        fields: ({ defaultFields }) => {
          return [...defaultFields]
        },
        hooks: {
          afterChange: [revalidateRedirect],
        },
      },
    }),
    nestedDocsPlugin({
      collections: ['categories'],
    }),
    seoPlugin({
      collections: ['pages', 'posts'],
      generateTitle,
      tabbedUI: true,
      uploadsCollection: 'media',
    }),
    formBuilderPlugin({
      fields: { payment: false },
      formOverrides: {
        access: {
          read: () => false,
        },
        fields: ({ defaultFields }) => {
          return [...defaultFields]
        },
      },
      formSubmissionOverrides: {
        slug: 'leads',
        access: {
          read: () => false,
        },
        fields: ({ defaultFields }) => {
          return [...defaultFields]
        },
      },
    }),
    // payloadCloudPlugin(),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
