import React, { useMemo, useState } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Query, SavedCart } from 'ssesandbox04.checkout-b2b'
import { Button, Dropdown, Modal, withToast } from 'vtex.styleguide'

import GET_SAVED_CARTS from '../graphql/getSavedCarts.graphql'
import { useOrderFormCustom } from '../hooks'
import type { WithToast } from '../typings'
import { messages } from '../utils'
import { TotalizerSpinner } from './TotalizerSpinner'

type GetSavedCartsQuery = Pick<Query, 'getSavedCarts'>

type Props = WithToast & {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function SavedCartsModalWrapper({ showToast, open, setOpen }: Props) {
  const { formatMessage } = useIntl()
  const { orderForm } = useOrderFormCustom()
  const [orderFormId, setOrderFormId] = useState<string>(orderForm.orderFormId)

  const { data, loading } = useQuery<GetSavedCartsQuery>(GET_SAVED_CARTS, {
    ssr: false,
    onError({ message }) {
      showToast?.({ message })
    },
  })

  const savedCarts = data?.getSavedCarts
  const selectedCart = useMemo(
    () =>
      savedCarts?.find((cart: SavedCart) => cart.orderFormId === orderFormId),
    [orderFormId, savedCarts]
  )

  const options = useMemo(
    () =>
      savedCarts?.map((cart: SavedCart) => ({
        label: cart.title,
        value: cart.orderFormId,
      })),
    [savedCarts]
  )

  const handleCloseModal = () => {
    setOpen(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderFormId(e.target.value)
  }

  const handleConfirm = () => {
    window.location.assign(
      `/checkout-b2b?orderFormId=${selectedCart?.orderFormId}`
    )
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleCloseModal}
      size="small"
      title={formatMessage(messages.savedCartsUseLabel)}
      bottomBar={
        <div className="flex flex-wrap items-center justify-around justify-between-ns w-100">
          <Button variation="tertiary" onClick={handleCloseModal}>
            {formatMessage(messages.cancel)}
          </Button>
          <Button variation="primary" onClick={handleConfirm}>
            {formatMessage(messages.confirm)}
          </Button>
        </div>
      }
    >
      <div className="pb7">
        {loading && <TotalizerSpinner />}
        {!loading && !!savedCarts?.length && (
          <Dropdown
            size="small"
            placeholder={formatMessage(messages.savedCartsSelectLabel)}
            options={options}
            value={selectedCart?.orderFormId}
            onChange={handleChange}
          />
        )}
      </div>
    </Modal>
  )
}

export const SavedCartsModal = withToast(SavedCartsModalWrapper)
