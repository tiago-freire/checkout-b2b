import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { Tag, Totalizer } from 'vtex.styleguide'

import { useOrderFormCustom, useOrganization } from '../hooks'
import { messages } from '../utils'
import { BillingAddress } from './BillingAddress'
import { ShippingAddress } from './ShippingAddress'
import { ShippingOption } from './ShippingOption'

export function ContactInfos() {
  const { formatMessage } = useIntl()
  const {
    orderForm: { clientProfileData, items },
  } = useOrderFormCustom()

  const { organization } = useOrganization()
  const { costCenter, users } = organization
  const costCenterPhone = costCenter?.phoneNumber ?? ''
  const clientProfilePhone = clientProfileData?.phone
  const phone = useMemo(() => costCenterPhone || clientProfilePhone, [
    clientProfilePhone,
    costCenterPhone,
  ])

  const getUsersByRole = useCallback(
    (role: string) =>
      users
        ?.filter((user) => user?.roleId === role)
        .map((user) => user?.name)
        .sort(),
    [users]
  )

  if (!clientProfileData) return null

  const { firstName, lastName, email } = clientProfileData
  const salesRepresentative = getUsersByRole('sales-representative')
  const salesAdmin = getUsersByRole('sales-admin')
  const contactFields: Array<{ label: string; value: React.ReactNode }> = []

  if (organization) {
    contactFields.push({
      label: formatMessage(messages.companyName),
      value: (
        <>
          <div className="mb1 flex items-center flex-wrap">
            {(organization.tradeName ?? '') || organization.name}
            {costCenter?.name && <Tag size="small">{costCenter?.name}</Tag>}
          </div>
          {(!!salesRepresentative?.length || !!salesAdmin?.length) && (
            <span className="t-mini">
              {!!salesRepresentative?.length && (
                <>
                  <span className="b">
                    {formatMessage(messages.salesRepresentative)}
                  </span>{' '}
                  {salesRepresentative.join(', ')}
                </>
              )}
              {!!salesRepresentative?.length && !!salesAdmin?.length && <br />}
              {!!salesAdmin?.length && (
                <>
                  <span className="b">
                    {formatMessage(messages.salesAdmin)}
                  </span>{' '}
                  {salesAdmin.join(', ')}
                </>
              )}
            </span>
          )}
        </>
      ),
    })
  }

  contactFields.push({
    label: formatMessage(messages.buyerName),
    value: (
      <>
        <div className="mb1">
          {firstName} {lastName}
        </div>
        <span className="t-mini">{email}</span>
        {phone && phone !== '+10000000000' && (
          <>
            <br />
            <span className="t-mini">{phone}</span>
          </>
        )}
      </>
    ),
  })

  contactFields.push({
    label: formatMessage(messages.shippingAddress),
    value: <ShippingAddress />,
  })

  contactFields.push({
    label: formatMessage(messages.billingAddress),
    value: <BillingAddress />,
  })

  if (items.length) {
    contactFields.push({
      label: formatMessage(messages.shippingOption),
      value: <ShippingOption />,
    })
  }

  return (
    <div className="mb4">
      <Totalizer items={contactFields} />
    </div>
  )
}
