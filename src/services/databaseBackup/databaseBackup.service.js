import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import logger from '../../core/config/logger.js'

const getMongoUri = () =>
  process.env.MONGODB_URI || process.env.DB_URL || ''

const getBackupDir = () =>
  path.resolve(process.cwd(), process.env.MONGODB_BACKUP_DIR || 'backups')

const getMaxBackupFiles = () => {
  const n = parseInt(process.env.MONGODB_BACKUP_MAX_FILES || '120', 10)
  return Number.isFinite(n) && n > 0 ? n : 120
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function pruneOldBackups(backupDir, maxFiles) {
  const entries = fs
    .readdirSync(backupDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.startsWith('db-backup-') && d.name.endsWith('.archive.gz'))
    .map((d) => ({
      name: d.name,
      mtime: fs.statSync(path.join(backupDir, d.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (entries.length <= maxFiles) return

  for (const { name } of entries.slice(maxFiles)) {
    try {
      fs.unlinkSync(path.join(backupDir, name))
      logger.info(`Removed old DB backup: ${name}`)
    } catch (err) {
      logger.warn(`Could not remove old backup ${name}: ${err.message}`)
    }
  }
}

/**
 * Full MongoDB logical dump via mongodump (MongoDB Database Tools must be on PATH).
 * Writes a gzip-compressed archive named with a timestamp under the backup directory.
 */
export async function runDatabaseBackup() {
  const uri = getMongoUri()
  if (!uri) {
    throw new Error('MONGODB_URI or DB_URL is not set')
  }

  const backupDir = getBackupDir()
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const fileName = `db-backup-${timestampForFilename()}.archive.gz`
  const archivePath = path.join(backupDir, fileName)

  await new Promise((resolve, reject) => {
    const args = ['--uri', uri, '--archive', archivePath, '--gzip', '--quiet']
    const child = spawn('mongodump', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })

    let stderr = ''
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'mongodump not found. Install MongoDB Database Tools and ensure mongodump is on PATH.'
          )
        )
      } else {
        reject(err)
      }
    })

    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`mongodump exited with code ${code}: ${stderr.trim() || 'no stderr'}`))
    })
  })

  pruneOldBackups(backupDir, getMaxBackupFiles())
  logger.info(`Database backup completed: ${archivePath}`)
}
