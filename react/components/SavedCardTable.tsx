import React, { useCallback, useMemo } from 'react'
import { useMutation, useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Query, SavedCart } from 'ssesandbox04.checkout-b2b'
import { Item } from 'vtex.checkout-graphql'
import type {
  AddToCartMutation,
  AddToCartMutationVariables,
  SetManualPriceMutation,
  SetManualPriceMutationVariables,
} from 'vtex.checkout-resources'
import {
  MutationAddToCart,
  MutationSetManualPrice,
} from 'vtex.checkout-resources'
import { FormattedPrice } from 'vtex.formatted-price'
import { Table } from 'vtex.styleguide'

import { useCheckoutB2BContext } from '../CheckoutB2BContext'
import GET_SAVED_CARTS from '../graphql/getSavedCarts.graphql'
import { useClearCart, useUpdatePayment } from '../hooks'
import { useOrderFormCustom } from '../hooks/useOrderFormCustom'
import { useToast } from '../hooks/useToast'
import type { CompleteOrderForm } from '../typings'
import { messages } from '../utils'
import { ActionCellRenderer } from './ActionCellRenderer'
import { TruncatedText } from './TruncatedText'

type GetSavedCartsQuery = Pick<Query, 'getSavedCarts'>

export function SavedCartsTable() {
  const showToast = useToast()
  const { formatMessage } = useIntl()
  const { orderForm, setOrderForm } = useOrderFormCustom()
  const {
    setPending,
    selectedCart,
    setSelectedCart,
    setOpenSavedCartModal,
  } = useCheckoutB2BContext()

  const selectedCartData = JSON.parse(selectedCart?.data ?? '{}')
  const { clearCart, isLoading: loadingClearCart } = useClearCart(false)

  const { data, loading } = useQuery<GetSavedCartsQuery>(GET_SAVED_CARTS, {
    ssr: false,
    fetchPolicy: 'network-only',
    onError({ message }) {
      showToast({ message })
    },
  })

  const [addItemsMutation, { loading: loadingAddItemsToCart }] = useMutation<
    AddToCartMutation,
    AddToCartMutationVariables
  >(MutationAddToCart, {
    onError({ message }) {
      showToast({ message })
    },
    onCompleted({ addToCart }) {
      setOrderForm({
        ...orderForm,
        ...addToCart,
        customData: selectedCartData.customData,
        paymentData: selectedCartData.paymentData,
      } as CompleteOrderForm)
    },
  })

  const [
    setManualPriceMutation,
    { loading: loadingSetManualPrice },
  ] = useMutation<SetManualPriceMutation, SetManualPriceMutationVariables>(
    MutationSetManualPrice,
    {
      onError({ message }) {
        showToast({ message })
      },
      onCompleted({ setManualPrice }) {
        setOrderForm({
          ...orderForm,
          ...setManualPrice,
          customData: selectedCartData.customData,
          paymentData: selectedCartData.paymentData,
        } as CompleteOrderForm)
      },
    }
  )

  const { updatePayment, loading: loadingUpdatePayment } = useUpdatePayment()

  const loadingApplySavedCart = useMemo(
    () =>
      loadingClearCart ||
      loadingAddItemsToCart ||
      loadingSetManualPrice ||
      loadingUpdatePayment,
    [
      loadingAddItemsToCart,
      loadingClearCart,
      loadingSetManualPrice,
      loadingUpdatePayment,
    ]
  )

  const savedCarts = data?.getSavedCarts

  const handleSelectCart = useCallback(
    (cartId: string) => {
      setSelectedCart(savedCarts?.find((cart: SavedCart) => cart.id === cartId))
    },
    [savedCarts, setSelectedCart]
  )

  const handleConfirm = useCallback(
    (cartId: string) => {
      handleSelectCart(cartId)
      const cart = savedCarts?.find((c: SavedCart) => c.id === cartId)

      if (!cart) return

      const { items, salesChannel, marketingData, paymentData } = JSON.parse(
        cart.data ?? '{}'
      )

      const { utmipage, ...newMarketingData } = marketingData ?? {}
      const { payments } = paymentData

      setPending(true)

      clearCart(undefined, {
        onSuccess: () => {
          addItemsMutation({
            variables: {
              items: items?.map(
                (item: Item & { assemblies?: unknown }, index: number) => ({
                  id: +item.id,
                  index,
                  quantity: item.quantity,
                  seller: item.seller,
                  uniqueId: item.uniqueId,
                  options: item.assemblies,
                })
              ),
              salesChannel,
              marketingData: marketingData
                ? {
                    ...newMarketingData,
                    ...(utmipage && { utmiPage: utmipage }),
                  }
                : null,
            },
          }).then(async () => {
            let index = 0

            for await (const item of items) {
              if (item.manualPrice) {
                await setManualPriceMutation({
                  variables: {
                    manualPriceInput: {
                      itemIndex: index++,
                      price: item.manualPrice,
                    },
                  },
                })
              }
            }

            if (payments?.[0]) {
              await updatePayment({
                variables: {
                  paymentData: {
                    payments: [
                      {
                        paymentSystem: payments[0].paymentSystem,
                        referenceValue: payments[0].referenceValue,
                        installmentsInterestRate:
                          payments[0].merchantSellerPayments?.[0]
                            ?.interestRate ?? 0,
                        installments: payments[0].installment ?? 1,
                        value: payments[0].value,
                      },
                    ],
                  },
                },
              })
            }

            setPending(false)
            setOpenSavedCartModal(false)
          })
        },
      })
    },
    [
      addItemsMutation,
      clearCart,
      handleSelectCart,
      savedCarts,
      setManualPriceMutation,
      setOpenSavedCartModal,
      setPending,
      updatePayment,
    ]
  )

  const parseCartData = useCallback((savedCartData: string) => {
    try {
      return JSON.parse(savedCartData)
    } catch {
      return {}
    }
  }, [])

  const renderCartValue = useCallback(
    (rowData: SavedCart) => {
      const cartData = parseCartData(rowData.data ?? '{}')

      return cartData?.value ? (
        <FormattedPrice value={cartData.value / 100} />
      ) : (
        <TruncatedText text="-" />
      )
    },
    [parseCartData]
  )

  const tableSchema = useMemo(
    () => ({
      properties: {
        createdIn: {
          width: 100,
          title: formatMessage(messages.createdIn),
          cellRenderer: ({ cellData }: { cellData: string }) =>
            new Date(cellData).toLocaleDateString(),
        },
        title: {
          title: formatMessage(messages.name),
          // eslint-disable-next-line react/display-name
          cellRenderer: ({ cellData }: { cellData: string }) => {
            return <TruncatedText text={cellData} />
          },
        },
        totalValue: {
          width: 115,
          title: formatMessage(messages.totalPrice),
          cellRenderer: ({ rowData }: { rowData: SavedCart }) =>
            renderCartValue(rowData),
        },
        totalItems: {
          width: 55,
          title: formatMessage(messages.items),
          cellRenderer: ({ rowData }: { rowData: SavedCart }) => {
            const cartData = parseCartData(rowData.data ?? '{}')

            return cartData?.items?.length ?? 0
          },
        },
        paymentMethod: {
          width: 150,
          title: formatMessage(messages.paymentMethods),
          // eslint-disable-next-line react/display-name
          cellRenderer: ({ rowData }: { rowData: SavedCart }) => {
            const cartData = parseCartData(rowData.data ?? '{}')
            const paymentSystemId =
              cartData?.paymentData?.payments?.[0]?.paymentSystem

            const paymentMethods = cartData?.paymentData?.paymentSystems
            const paymentMethodName = paymentMethods?.find(
              (method: { id: number }) =>
                String(method.id) === String(paymentSystemId)
            )?.name

            return <TruncatedText text={paymentMethodName} />
          },
        },
        action: {
          title: ' ',
          width: 50,
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
    [
      formatMessage,
      handleConfirm,
      loadingApplySavedCart,
      renderCartValue,
      parseCartData,
    ]
  )

  return (
    <Table
      schema={tableSchema}
      fullWidth
      items={savedCarts ?? []}
      density="low"
      loading={loading}
    />
  )
}