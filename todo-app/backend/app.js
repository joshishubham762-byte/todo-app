require('dotenv').config();

const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173'
].filter(Boolean);

console.log('FRONTEND_ORIGIN:', process.env.FRONTEND_ORIGIN);
console.log('Allowed origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {

        console.log('REQUEST ORIGIN:', origin);

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ BLOCKED ORIGIN:', origin);
            console.log('❌ ALLOWED ORIGINS:', allowedOrigins);

            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
    res.send('Todo App API is running');
});

module.exports = app;