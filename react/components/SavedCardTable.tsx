import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type { SavedCart } from 'ssesandbox04.checkout-b2b'
import { Table } from 'vtex.styleguide'

import { messages } from '../utils'
import { ActionCellRenderer } from './ActionCellRenderer'

interface SavedCartsTableProps {
  savedCarts: SavedCart[] | undefined
  handleConfirm: (id: string) => void
  handleSelectCart: (id: string) => void
  loadingApplySavedCart: boolean
}

export function SavedCartsTable({
  savedCarts,
  handleConfirm,
  handleSelectCart,
  loadingApplySavedCart,
}: SavedCartsTableProps) {
  const { formatMessage } = useIntl()

  const parseCartData = (data: string) => {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  const tableSchema = useMemo(
    () => ({
      properties: {
        createdIn: {
          title: formatMessage(messages.createdIn),
          cellRenderer: ({ cellData }: { cellData: string }) =>
            new Date(cellData).toLocaleString(),
        },
        title: {
          title: formatMessage(messages.name),
        },
        totalValue: {
          title: formatMessage(messages.totalPrice),
          cellRenderer: ({ rowData }: { rowData: SavedCart }) => {
            const cartData = parseCartData(rowData.data ?? '{}')

            return cartData?.value
              ? `R$ ${(cartData.value / 100).toFixed(2)}`
              : '-'
          },
        },
        totalItems: {
          title: formatMessage(messages.quantity),
          cellRenderer: ({ rowData }: { rowData: SavedCart }) => {
            const cartData = parseCartData(rowData.data ?? '{}')

            return cartData?.items?.length ?? 0
          },
        },
        paymentMethod: {
          title: formatMessage(messages.paymentMethods),
          cellRenderer: ({ rowData }: { rowData: SavedCart }) => {
            const cartData = parseCartData(rowData.data ?? '{}')
            const paymentSystemId =
              cartData?.paymentData?.payments?.[0]?.paymentSystem

            const paymentMethods = cartData?.paymentData?.paymentSystems
            const paymentMethodName = paymentMethods?.find(
              (method: { id: number }) =>
                String(method.id) === String(paymentSystemId)
            )?.name

            return paymentMethodName ?? '-'
          },
        },
        action: {
          title: ' ',
          cellRenderer: function ActionRenderer({
            rowData,
          }: {
            rowData: SavedCart
          }) {
            return (
              <ActionCellRenderer
                rowData={rowData}
                handleConfirm={handleConfirm}
                loading={loadingApplySavedCart}
              />
            )
          },
        },
      },
    }),
    [formatMessage, handleConfirm, loadingApplySavedCart]
  )

  return (
    <Table
      schema={tableSchema}
      items={savedCarts ?? []}
      density="low"
      onRowClick={({ rowData }: { rowData: SavedCart }) =>
        handleSelectCart(rowData.id)
      }
    />
  )
}
