import { GraphQLClient } from 'graphql-request'
import { parse } from 'yaml'
import { balancesQuery, type AccountData, type BalancesResponse, type BalancesVariables } from './queries'
import { logger } from './logger'
import { getConfig } from './config'
import { existsSync, readFileSync } from 'fs'

export type Whitelist = {
  name: string
  address: string
  maxBalance?: number
}[]

export async function loadWhitelist(): Promise<Whitelist | undefined> {
  let whitelist: Whitelist = []

  if (existsSync('./whitelist.yml')) {
    try {
      logger.debug('Got whitelist')
      const whitelistFile = readFileSync('./whitelist.yml', 'utf8')
      whitelist = parse(whitelistFile) as Whitelist
      logger.trace(whitelist, 'Whitelist')
    } catch (e) {
      logger.error('Whitelist wrong format')
      return undefined
    }
  } else {
    logger.debug('Whitelist yaml not found')
  }

  return whitelist
}

export async function getAccountsExceedingThreshold(threshold: number): Promise<AccountData[]> {
  const { chainDecimals, statsApiUrl } = getConfig()

  const chainThreshold = BigInt(threshold * 10 ** chainDecimals)
  const client = new GraphQLClient(statsApiUrl)
  const accounts: AccountData[] = []
  logger.debug(`Querying gql looking for address with balance bigger than ${chainThreshold}`)
  let res = await client.request<BalancesResponse, BalancesVariables>(balancesQuery, {
    threshold: chainThreshold.toString(),
  })
  logger.debug(`Got ${res.accountsConnection.edges.length} accounts`)
  accounts.push(...res.accountsConnection.edges.map(a => a.node))
  while (res.accountsConnection.pageInfo.hasNextPage) {
    logger.debug('Has next page')
    res = await client.request<BalancesResponse, BalancesVariables>(balancesQuery, {
      after: res.accountsConnection.pageInfo.endCursor,
      threshold: chainThreshold.toString(),
    })
    logger.debug(`Got ${res.accountsConnection.edges.length} accounts`)
    accounts.push(...res.accountsConnection.edges.map(a => a.node))
  }
  return accounts
}

export async function getFilteredAmountsToSlash(whitelist: Whitelist, accounts: AccountData[]): Promise<Map<string, bigint>> {
  const { chainDecimals, balanceTarget } = getConfig()

  const amountsToSlash = new Map<string, bigint>()
  for (const acc of accounts) {
    const whitelistInfo = whitelist.find(a => acc.id === a.address)
    // if there's no maxBalance we don't need to slash at all
    if (whitelistInfo != null && whitelistInfo.maxBalance == null) {
      logger.debug(`${acc.id} is whitelisted`)
      continue
    }

    const targetBalance = BigInt(Number(whitelistInfo?.maxBalance ?? balanceTarget) * 10 ** chainDecimals)
    if (BigInt(acc.free) <= targetBalance) {
      continue
    }
    const toSlash = BigInt(acc.free) - targetBalance
    logger.debug(`Pushing ${acc.id} with target balance ${targetBalance} - to be slashed ${toSlash}`)
    amountsToSlash.set(acc.id, toSlash)
  }
  logger.debug('Filtered accounts pushed')
  return amountsToSlash
}
