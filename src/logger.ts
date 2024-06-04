import pino from 'pino'

const level = process.env.LOG_LEVEL ?? 'info'

export const logger = pino({ level }, pino.transport({ target: 'pino/file' }))
logger.debug('Logger created')
