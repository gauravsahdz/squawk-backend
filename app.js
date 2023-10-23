const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');


const postRouter = require('./routes/postRoute');
const userRouter = require('./routes/userRoute');
const notificationRouter = require('./routes/notificationRoute');
const globalErrorHandler = require('./controller/errorController');
const AppError = require('./utils/appError');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/email'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());



// Enable CORS - Cross Origin Resource Sharing
app.use(cors());

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.get('/', (req, res) => {
    res.status(200).render('welcome');
});

// 3) ROUTES
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/notifications', notificationRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;