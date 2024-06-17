import { type ApiPromise } from '@polkadot/api'
import { logger } from './logger'
import { type KeyringPair } from '@polkadot/keyring/types'
import { getConfig } from './config'

/**
 * Executes a force transfer of tokens using a sudo (superuser) account.
 * This function allows a superuser to forcibly transfer tokens from any account to the superuser's account.
 *
 * @param {ApiPromise} api - The API service that allows interaction with the blockchain.
 * @param {KeyringPair} sudoKey - The keyring pair for the sudo (superuser) account.
 * @param {Object} params - An object containing the parameters for the transfer.
 * @param {bigint} params.amount - The amount of tokens to be transferred.
 * @param {string} params.from - The address from which tokens will be transferred.
 * @returns {Promise<void>} A promise that resolves when the transaction has been processed.
 */
export async function forceTransfer(
  api: ApiPromise,
  sudoKey: KeyringPair,
  { amount, from }: { amount: bigint; from: string },
): Promise<void> {
  const { dryRun } = getConfig()
  logger.debug(`Starting force transfer... moving ${amount.toString()} tokens from ${from} to ${sudoKey.address}`)
  const tx = api.tx.sudo.sudo(api.tx.balances.forceTransfer(from, sudoKey.address, amount))

  if (dryRun) {
    const result = await tx.dryRun(sudoKey)
    logger.debug(`Dry run enabled. Transfer: Ok: ${result.isOk}, Status: ${String(result.toString())}`)
  } else {
    // TODO: Get the actual tx result and log it
    const result = await tx.signAndSend(sudoKey)
    logger.debug(`Tx signed and sent. Transfer Hash: ${result.toString()}`)
  }
}
