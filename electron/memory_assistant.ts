import ollama from 'ollama';

export class Assistant {
    memory_system_prompt: string;
    chat_system_prompt: string;
    tools: any;
    constructor() {
        this.memory_system_prompt = `You are a memory system.
          When users share important information:
          - Extract key facts and keywords
          - Use session:note to store this information
          - Store only keywords and key facts
          When users ask questions:
          - Use session:query to retrieve relevant memories
          - Respond with accurate, previously stored information
          - Use only keywords to search for relevant memories
          - If the question is specific, set smaller nResult (5-10), otherwise set larger nResult (20-50)
          Be selective - only store truly important information.`;
        this.chat_system_prompt = `These are the results of querying past memories and the database based on the question.
        Please use these additional context to find useful information and respond to the user accurately.`;
        this.tools = [
            {
                type: 'function',
                function: {
                    name: 'session:note',
                    description: 'Note the conversation',
                    parameters: {
                        type: 'object',
                        properties: {
                            keywords: {
                                type: 'string',
                                description: 'The keywords to remember',
                            },
                        },
                        required: ['keywords']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'session:query',
                    description: 'Query the conversation memory',
                    parameters: {
                        type: 'object',
                        properties: {
                            content: {
                                type: 'string',
                                description: 'keywords to retrieve data from embedded memory',
                            },
                            nResults: {
                                type: 'number',
                                description: 'number of results to return',
                            },
                        },
                        required: ['content', 'nResults']
                    }
                }
            }
        ]
    }
    async call_apis(prompt: any) {
        const response = await ollama.chat({
            model: prompt.model ? prompt.model : 'llama3.1',
            messages: [
                { role: 'system', content: this.memory_system_prompt },
                { role: 'user', content: prompt.content }],
            tools: this.tools
        });
        return response.message;
    }
    async chat(prompt: any, extra_context: string, event: any) {
        console.log(prompt.content, extra_context);
        const response = await ollama.chat({
            model: prompt.model ? prompt.model : 'llama3.1',
            messages: [
                { role: 'system', content: this.chat_system_prompt},
                { role: 'user', content: `### User Prompt:\n${prompt.content}\n\n### Additional Context:\n${extra_context}\n\n` }],
            stream: true,
        });
        for await (const part of response) {
            event.sender.send('llm:stream', part.message.content);
        }
    }
}