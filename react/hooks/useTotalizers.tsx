import React from 'react'
import { useIntl } from 'react-intl'
import { FormattedPrice } from 'vtex.formatted-price'
import { IconHelp, Tooltip } from 'vtex.styleguide'

import { PaymentData } from '../components/PaymentData'
import { PONumber } from '../components/PONumber'
import { TruncatedText } from '../components/TruncatedText'
import { messages } from '../utils'
import { useOrderFormCustom } from './useOrderFormCustom'

export function useTotalizers() {
  const { formatMessage } = useIntl()
  const { orderForm } = useOrderFormCustom()
  const { totalizers = [], value: total = 0, items } = orderForm

  if (!totalizers.length || !items?.length) return []

  const hasQuotationDiscount = items.some(
    (item) => item.manualPrice && item.manualPrice < (item.price ?? 0)
  )

  return [
    {
      label: formatMessage(messages.paymentMethods),
      value: <PaymentData />,
    },
    {
      label: formatMessage(messages.PONumber),
      value: <PONumber />,
    },
    ...totalizers.map((t) => ({
      label: t.name,
      value: (
        <div className="flex">
          <TruncatedText text={<FormattedPrice value={t.value / 100} />} />
          {t.id === 'Discounts' && hasQuotationDiscount && (
            <Tooltip label={formatMessage(messages.quotationDiscount)}>
              <span className="ml2">
                <IconHelp />
              </span>
            </Tooltip>
          )}
        </div>
      ),
    })),
    {
      label: formatMessage(messages.total),
      value: <TruncatedText text={<FormattedPrice value={total / 100} />} />,
    },
  ]
}
