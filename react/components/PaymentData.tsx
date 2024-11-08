import React, { useCallback, useEffect } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { OrderForm, PaymentDataInput } from 'vtex.checkout-graphql'
import type { UpdateOrderFormPaymentMutation } from 'vtex.checkout-resources'
import { MutationUpdateOrderFormPayment } from 'vtex.checkout-resources'
import { Dropdown, withToast } from 'vtex.styleguide'

import { useOrderFormCustom } from '../hooks'
import type { WithToast } from '../typings'
import { getFirstInstallmentByPaymentSystem, messages } from '../utils'
import { TotalizerSpinner } from './TotalizerSpinner'

function PaymentDataWrapper({ showToast }: WithToast) {
  const {
    orderForm,
    setOrderForm,
    loading: orderFormLoading,
  } = useOrderFormCustom()

  const { formatMessage } = useIntl()

  const [updatePayment, { loading }] = useMutation<
    UpdateOrderFormPaymentMutation,
    { paymentData: PaymentDataInput }
  >(MutationUpdateOrderFormPayment, {
    onCompleted({ updateOrderFormPayment }) {
      setOrderForm(updateOrderFormPayment as OrderForm)
    },
    onError({ message }) {
      showToast?.({ message })
    },
  })

  const { paymentSystems, payments, installmentOptions } = orderForm.paymentData

  const filteredPaymentSystems = paymentSystems.filter(
    (paymentSystem) => paymentSystem.groupName !== 'creditCardPaymentGroup'
  )

  const options = filteredPaymentSystems.map((paymentSystem) => ({
    value: paymentSystem.id,
    label: paymentSystem.name,
  }))

  const [selectedPayment] = payments

  const setPayment = useCallback(
    (newPaymentSystem: string) => {
      const installment = getFirstInstallmentByPaymentSystem(
        installmentOptions,
        newPaymentSystem
      )

      if (!installment) return

      updatePayment({
        variables: {
          paymentData: {
            payments: [
              {
                paymentSystem: newPaymentSystem,
                referenceValue: installment.value,
                installmentsInterestRate: installment.interestRate,
                installments: installment.count,
                value: installment.total,
              },
            ],
          },
        },
      })
    },
    [installmentOptions, updatePayment]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setPayment(e.target.value),
    [setPayment]
  )

  const validPaymentSystem = filteredPaymentSystems.find(
    (paymentSystem) => paymentSystem.id === selectedPayment?.paymentSystem
  )

  useEffect(() => {
    if (
      !loading &&
      !orderFormLoading &&
      filteredPaymentSystems.length &&
      !validPaymentSystem
    ) {
      setPayment(filteredPaymentSystems[0].id)
    }
  }, [
    filteredPaymentSystems,
    loading,
    orderFormLoading,
    setPayment,
    validPaymentSystem,
  ])

  if (loading) {
    return <TotalizerSpinner />
  }

  return (
    <Dropdown
      size="small"
      placeholder={formatMessage(messages.selectPaymentMethods)}
      options={options}
      value={selectedPayment?.paymentSystem}
      onChange={handleChange}
    />
  )
}

export const PaymentData = withToast(PaymentDataWrapper)
