import { getConfig } from './config'
import { logger } from './logger'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { getAccountsExceedingThreshold, getFilteredAmountsToSlash, loadWhitelist } from './balances'
import { forceTransfer } from './extrinsics'
/**
 * The main function to slash accounts with balances exceeding a specified threshold.
 * This function performs the following steps:
 * 1. Loads the configuration settings.
 * 2. Initializes the API and keyring.
 * 3. Retrieves accounts with balances exceeding the threshold.
 * 4. Loads the whitelist of accounts to exclude from slashing.
 * 5. Calculates the amounts to slash to bring balances down to the target.
 * 6. Optionally filters the accounts to slash based on a forced address.
 * 7. Executes the force transfer for each account to be slashed.
 * 8. Logs the results of the slashing process.
 *
 * @returns {Promise<void>} A promise that resolves when the slashing process is complete.
 */
export async function slashAccount(): Promise<void> {
  const { balanceTarget, nodeUrl, balanceThreshold, rootMnemonic, addressToSlash } = getConfig()
  logger.info('Starting...')
  const api = await ApiPromise.create({ provider: new WsProvider(nodeUrl) })

  const keyring = new Keyring({ type: 'sr25519' })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const keypair = keyring.addFromUri(rootMnemonic)
  logger.debug('ROOT_MNEMONIC appended to keyring')

  logger.info(`Looking for accounts with balances bigger than ${balanceThreshold} pas`)

  const accountsToSlash = await getAccountsExceedingThreshold(balanceThreshold)
  logger.info(`Accounts exceeding threshold: [${accountsToSlash.length}]`)
  logger.trace(`Accounts exceeding threshold [${JSON.stringify(accountsToSlash)}]`)

  const whitelist = await loadWhitelist()
  if (!whitelist) {
    return
  }

  logger.info(`Calculating amounts to slash to leave them all with ${balanceTarget} pas`)
  const filteredBalances = await getFilteredAmountsToSlash(whitelist, accountsToSlash)
  let filteredBalancesArray = Array.from(filteredBalances.entries())
  logger.info(`Filtered amounts to slash: [${filteredBalancesArray.length}]`)

  // we can't directly log Maps
  if (addressToSlash) {
    logger.info(`Forced address to slash is set. Filtering address to slash to leave only the addr [${addressToSlash}]`)
    filteredBalancesArray = filteredBalancesArray.filter(([addr]) => addr === addressToSlash)
  }

  logger.trace(`Filtered amounts to slash [${JSON.stringify(filteredBalancesArray, (_, v) => (typeof v === 'bigint' ? v.toString() : v))}]`)

  for (const [from, amount] of filteredBalancesArray) {
    await forceTransfer(api, keypair, { from, amount })
  }

  const tokensRecovered = filteredBalancesArray.reduce((sum, balance) => balance[1] + sum, 0n)
  logger.info(`Process completed. Accounts slashed: ${filteredBalancesArray.length}. Tokens recovered: ${tokensRecovered.toString()}`)
}
