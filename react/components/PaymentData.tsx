import React, { useCallback, useEffect, useMemo } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import { Dropdown } from 'vtex.styleguide'
import { FormattedPrice } from 'vtex.formatted-price'
import type { PaymentDataInput } from 'vtex.checkout-graphql'
import { MutationUpdateOrderFormPayment } from 'vtex.checkout-resources'
import type { UpdateOrderFormPaymentMutation } from 'vtex.checkout-resources'

import {
  useToast,
  useOrganization,
  useOrderFormCustom,
  useFetchCustomerCredit,
} from '../hooks'
import {
  messages,
  CUSTOMER_CREDIT_ID,
  getFirstInstallmentByPaymentSystem,
} from '../utils'
import type { CompleteOrderForm } from '../typings'
import { useCheckoutB2BContext } from '../CheckoutB2BContext'
import { TotalizerSpinner } from './TotalizerSpinner'

export function PaymentData() {
  const showToast = useToast()
  const { formatMessage } = useIntl()
  const { setPending } = useCheckoutB2BContext()
  const { organization } = useOrganization()

  const {
    orderForm,
    setOrderForm,
    loading: orderFormLoading,
  } = useOrderFormCustom()

  const [updatePayment, { loading }] = useMutation<
    UpdateOrderFormPaymentMutation,
    { paymentData: PaymentDataInput }
  >(MutationUpdateOrderFormPayment, {
    onCompleted({ updateOrderFormPayment }) {
      setOrderForm({
        ...orderForm,
        ...updateOrderFormPayment,
      } as CompleteOrderForm)
    },
    onError({ message }) {
      showToast({ message })
    },
  })

  const { value } = orderForm
  const { paymentSystems, payments, installmentOptions } = orderForm.paymentData

  const filteredPaymentSystems = useMemo(
    () =>
      paymentSystems.filter(
        (paymentSystem) => paymentSystem.groupName !== 'creditCardPaymentGroup'
      ),
    [paymentSystems]
  )

  const options = filteredPaymentSystems.map((paymentSystem) => ({
    value: paymentSystem.id,
    label: paymentSystem.name,
  }))

  const [selectedPayment] = payments

  const { data: customerCreditData } = useFetchCustomerCredit({
    enabled:
      !!organization?.salesChannel &&
      selectedPayment.paymentSystem === CUSTOMER_CREDIT_ID,
  })

  const setPayment = useCallback(
    (newPaymentSystem: string) => {
      const installment = getFirstInstallmentByPaymentSystem(
        installmentOptions,
        newPaymentSystem
      )

      setPending(true)

      updatePayment({
        variables: {
          paymentData: {
            payments: [
              {
                paymentSystem: newPaymentSystem,
                referenceValue: installment?.value ?? value,
                installmentsInterestRate: installment?.interestRate ?? 0,
                installments: installment?.count ?? 1,
                value: installment?.total ?? value,
              },
            ],
          },
        },
      }).finally(() => setPending(false))
    },
    [installmentOptions, setPending, updatePayment, value]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPayment(e.target.value)
    },
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
      helpText={
        selectedPayment.paymentSystem === CUSTOMER_CREDIT_ID &&
        (customerCreditData ? (
          <div className="flex items-center flex-wrap">
            {formatMessage(messages.creditAvailable)}:{' '}
            <strong>
              <FormattedPrice value={customerCreditData?.availableCredit} />
            </strong>
          </div>
        ) : (
          formatMessage(messages.noCreditAvailable)
        ))
      }
    />
  )
}
