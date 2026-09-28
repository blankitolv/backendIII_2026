export const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'ShipNow API', version: '1.0.0' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'OK' } } }
    },
    '/auth/register': {
      post: { summary: 'Register', responses: { 201: { description: 'Created' } } }
    },
    '/auth/login': {
      post: { summary: 'Login', responses: { 200: { description: 'OK' } } }
    },
    '/auth/me': {
      get: { summary: 'Current user', responses: { 200: { description: 'OK' } } }
    }
  }
};
