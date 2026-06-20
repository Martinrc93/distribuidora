const request = require('supertest');
const express = require('express');
const errorHandler = require('../middleware/errorHandler.js');

describe('Error Handler Middleware Tests', () => {
    let app;

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    beforeEach(() => {
        app = express();
        
        // Endpoint that throws a 500 error
        app.get('/error-500', (req, res, next) => {
            const err = new Error('Sensitive database database.sqlite error details');
            next(err);
        });

        // Endpoint that throws a 400 error
        app.get('/error-400', (req, res, next) => {
            const err = new Error('User input is bad');
            err.statusCode = 400;
            next(err);
        });

        app.use(errorHandler);
    });

    afterAll(() => {
        console.error.mockRestore();
        // Reset NODE_ENV to test
        process.env.NODE_ENV = 'test';
    });

    test('should expose full message when NODE_ENV is test', async () => {
        process.env.NODE_ENV = 'test';
        const response = await request(app)
            .get('/error-500')
            .expect(500);
        
        expect(response.body.error).toBe('Sensitive database database.sqlite error details');
    });

    test('should mask message and return generic error when NODE_ENV is production', async () => {
        process.env.NODE_ENV = 'production';
        const response = await request(app)
            .get('/error-500')
            .expect(500);
        
        expect(response.body.error).toBe('Error interno del servidor');
    });

    test('should still expose non-500 error messages in production', async () => {
        process.env.NODE_ENV = 'production';
        const response = await request(app)
            .get('/error-400')
            .expect(400);
        
        expect(response.body.error).toBe('User input is bad');
    });
});
