import { ServiceContext } from '@vtex/api'
import type { QueryGetSavedCartsArgs } from 'ssesandbox04.checkout-b2b'

import { Clients } from '../../clients'
import { getAllSavedCarts, getSessionData, saveSchemas } from '../../utils'

export const getSavedCarts = async (
  _: unknown,
  { parentCartId }: QueryGetSavedCartsArgs,
  context: ServiceContext<Clients>
) => {
  await saveSchemas(context)
  const { organizationId, costCenterId } = await getSessionData(context)

  const where: string[] = []

  where.push(`(organizationId='${organizationId}')`)
  where.push(`(costCenterId='${costCenterId}')`)

  if (parentCartId) {
    where.push(`(parentCartId='${parentCartId}')`)
  } else {
    where.push(`(parentCartId is null)`)
  }

  return getAllSavedCarts({
    context,
    where: where.join(' AND '),
    sort: `createdIn ${parentCartId ? 'ASC' : 'DESC'}`,
  })
}
