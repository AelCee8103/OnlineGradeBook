import express from 'express'
import cors from 'cors'
import authRouter from './routes/authroutes.js' 
import Pages from './routes/Pages.js'

const app = express();
app.use(cors())
app.use(express.json())
app.use('/auth', authRouter)
app.use('/Pages', Pages)
// In your server setup
app.use(cors({
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true
  }));

app.listen(process.env.PORT, () => {
    console.log('Server is running on port 3000')
})