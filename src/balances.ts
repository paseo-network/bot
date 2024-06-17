import { GraphQLClient } from 'graphql-request'
import { parse } from 'yaml'
import { balancesQuery, type AccountData, type BalancesResponse, type BalancesVariables } from './queries'
import { logger } from './logger'
import { getConfig } from './config'
import { existsSync, readFileSync } from 'fs'

/**
 * Represents a whitelist of accounts.
 *
 * Each account in the whitelist has the following properties:
 * - `name`: The name of the account.
 * - `address`: The address of the account.
 * - `maxBalance` (optional): The maximum balance allowed for the account.
 */
export type Whitelist = {
  name: string
  address: string
  maxBalance?: number
}[]

/**
 * Loads the whitelist from a YAML file.
 *
 * This function attempts to read a file named 'whitelist.yml' from the current directory.
 * If the file exists and is in the correct format, it parses the file and returns the whitelist.
 * If the file exists but is in the wrong format, it logs an error message and returns undefined.
 * If the file does not exist, it logs a debug message and returns an empty array.
 *
 * @returns {Promise<Whitelist | undefined>} A promise that resolves to the whitelist array if the file is found and correctly parsed, or undefined if the file is in the wrong format.
 */

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

/**
 * Fetches accounts with balances exceeding a specified threshold.
 *
 * @param {number} threshold - The balance threshold to filter accounts.
 * @returns {Promise<AccountData[]>} - A promise that resolves to an array of account data objects.
 */
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

/**
 * Filters accounts and calculates the amounts to slash based on a whitelist and target balance.
 *
 * @param {Whitelist} whitelist - The list of whitelisted accounts with their respective max balances.
 * @param {AccountData[]} accounts - The list of accounts to be checked against the whitelist.
 * @returns {Promise<Map<string, bigint>>} - A promise that resolves to a map where the key is the account ID and the value is the amount to be slashed.
 */
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
