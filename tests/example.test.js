/**
 * Example test file
 * 
 * This demonstrates how to write tests using Jest and Supertest
 */

const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('API Info', () => {
  it('should return API information', async () => {
    const response = await request(app).get('/api');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ok', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
  });
});

// Example unit test for a service
describe('Example Service Tests', () => {
  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 }
      ];
      
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      expect(total).toBe(35);
    });
  });
  
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const email = 'test@example.com';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(regex.test(email)).toBe(true);
    });
    
    it('should reject invalid email', () => {
      const email = 'invalid-email';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(regex.test(email)).toBe(false);
    });
  });
});

// Example mock test
describe('Example Mock Tests', () => {
  it('should mock external API call', async () => {
    // Mock implementation
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true })
    });
    
    global.fetch = mockFetch;
    
    const result = await fetch('https://api.example.com/data');
    const data = await result.json();
    
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data');
    expect(data).toEqual({ success: true });
  });
});

