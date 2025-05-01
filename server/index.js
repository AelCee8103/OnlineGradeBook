import express from 'express';
import cors from 'cors';
import authRouter from './routes/authroutes.js';
import Pages from './routes/Pages.js';

const app = express();

// Apply CORS with correct origin (your frontend on Vite: http://localhost:5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Define routes
app.use('/auth', authRouter);
app.use('/Pages', Pages);

// Start server
app.listen(process.env.PORT, () => {
  console.log('Server is running on port 3000');
});
