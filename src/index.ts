import { configDotenv } from 'dotenv'
import { logger } from './logger'
import { slashAccount } from './slashAccount'

configDotenv()

slashAccount()
  .then(() => {
    process.exit(0)
  })
  .catch(e => {
    logger.error(e)
    process.exit(1)
  })
