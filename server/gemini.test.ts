import { describe, it, expect } from 'vitest';
import { invokeLLM } from './server/_core/llm';

describe('Gemini API Key Validation', () => {
  it('should successfully call Gemini API with valid key', async () => {
    // Simple test to verify API key works
    const response = await invokeLLM({
      messages: [
        { role: 'user', content: 'Say "API key is valid" if you can read this.' },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message.content).toBeDefined();
    expect(response.choices[0].message.content.toLowerCase()).toContain('valid');
  }, 30000); // 30 second timeout for API call
});
