import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import authMiddleware from './middleware/auth.js'

const app = express()

app.use(cors())
app.use(express.json())

// routes
app.use('/auth', authRoutes)

// test protected route
app.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: "Đây là route bảo vệ",
    user: req.user
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

app.get('/', (req, res) => {
  res.send('API is running 🚀')
})