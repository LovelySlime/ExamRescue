import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const localApiPlugin = (): Plugin => ({
  name: 'exam-rescue-local-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split('?')[0] : ''
      const dataDir = path.resolve(process.cwd(), 'data')
      const questionsFile = path.join(dataDir, 'questions.json')
      const resultsFile = path.join(dataDir, 'results.json')

      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // GET /api/questions
      const sampleQuestionsFile = path.join(dataDir, 'questions.sample.json')
      if (req.method === 'GET' && url === '/api/questions') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (fs.existsSync(questionsFile)) {
          const content = fs.readFileSync(questionsFile, 'utf-8')
          res.statusCode = 200
          res.end(content)
        } else if (fs.existsSync(sampleQuestionsFile)) {
          const content = fs.readFileSync(sampleQuestionsFile, 'utf-8')
          res.statusCode = 200
          res.end(content)
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'questions.json not found in data/' }))
        }
        return
      }

      // GET /api/results (サーバー上の結果JSONを取得)
      if (req.method === 'GET' && url === '/api/results') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (fs.existsSync(resultsFile)) {
          const content = fs.readFileSync(resultsFile, 'utf-8')
          res.statusCode = 200
          res.end(content)
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'results.json not found' }))
        }
        return
      }

      // POST /api/results
      if (req.method === 'POST' && url === '/api/results') {
        let body = ''
        req.on('data', chunk => {
          body += chunk
        })
        req.on('end', () => {
          try {
            JSON.parse(body)
            fs.writeFileSync(resultsFile, body, 'utf-8')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.statusCode = 200
            res.end(JSON.stringify({ success: true, message: 'Saved to data/results.json' }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
          }
        })
        return
      }

      // GET /api/status
      if (req.method === 'GET' && url === '/api/status') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        const hasQuestions = fs.existsSync(questionsFile)
        let questionsCount = 0
        let title = ''
        if (hasQuestions) {
          try {
            const data = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'))
            title = data.title || ''
            questionsCount = Array.isArray(data.questions) ? data.questions.length : 0
          } catch {
            // ignore
          }
        }
        res.statusCode = 200
        res.end(
          JSON.stringify({
            status: 'ok',
            hasQuestions,
            questionsCount,
            title,
            hasResults: fs.existsSync(resultsFile),
          })
        )
        return
      }

      next()
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  server: {
    watch: {
      ignored: ['**/data/**', '**/results.json'],
    },
  },
})
