import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useIntl } from 'react-intl'
import 'vtex.country-codes/locales'
import { useCssHandles } from 'vtex.css-handles'
import { ExtensionPoint, useRuntime } from 'vtex.render-runtime'
import { Layout, PageHeader, ToastProvider } from 'vtex.styleguide'

import { CheckoutB2BProvider } from './CheckoutB2BContext'
import { CheckoutB2bTable } from './components/CheckoutB2bTable'
import { SavedCarts } from './components/SavedCarts'
import { queryClient } from './services'
import './styles.css'
import { messages } from './utils'

function CheckoutB2B() {
  const handles = useCssHandles(['container', 'table'])

  const { navigate } = useRuntime()
  const { formatMessage } = useIntl()

  return (
    <div className={handles.container}>
      <Layout
        fullWidth
        pageHeader={
          <PageHeader
            title={<ExtensionPoint id="rich-text" />}
            linkLabel={formatMessage(messages.backToHome)}
            onLinkClick={() =>
              navigate({ page: 'store.home', fallbackToWindowLocation: true })
            }
          >
            <SavedCarts />
          </PageHeader>
        }
      >
        <CheckoutB2bTable />
      </Layout>
    </div>
  )
}

function CheckoutB2BWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider positioning="window">
        <CheckoutB2BProvider>
          <CheckoutB2B />
        </CheckoutB2BProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default CheckoutB2BWrapper
