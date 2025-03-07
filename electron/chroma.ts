import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {ChromaClient, OllamaEmbeddingFunction} = require('chromadb');

export class EmbeddedClient {
    client: typeof ChromaClient;
    embeddingFunc: typeof OllamaEmbeddingFunction;
    session_history: any;
    pdf_db: any;
    constructor() {
        this.client = new ChromaClient({ path: "http://localhost:5050" });
        this.embeddingFunc = new OllamaEmbeddingFunction({
            url: "http://localhost:11434/api/embeddings",
            model: "mxbai-embed-large", 
        });
        this.session_history = null;
        this.pdf_db = null;
    }
    async connect() {
        if (this.client) return;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.connect();
    }
    async getClient() {
        await this.connect();
        return this.client;
    }
    async getSessionHistory(session_name: string) {
        this.session_history = await (await this.getClient()).getOrCreateCollection({
            name: session_name,
            embeddingFunction: this.embeddingFunc
        });
    }
    async addSessionHistory(documents: string[], ids: string[], user: string) {
        if (this.session_history) {
            const embeddings = await this.embeddingFunc.generate(documents);
            await this.session_history.add({
                ids: ids,
                documents: documents,
                embeddings: embeddings,
                metadatas: [{ user: user }]
            });
            return true;
        } else return false;
    }
    async querySessionHistory(prompt: string, nResults: Number, user: string) {
        if (this.session_history) {
            const queryEmbedding = await this.embeddingFunc.generate([prompt]);
            const results = await this.session_history.query({
                nResults: nResults,
                queryEmbeddings: queryEmbedding,
                where: {user: user}
            });
            return results;
        } else return [];
    }
    async getPdfDataBase() {
        this.pdf_db = await this.client.getOrCreateCollection({
            name: 'pdf',
            embeddingFunction: this.embeddingFunc,
        });
    }
    async addPdfData(documents: string[], ids: string[], metas: any = null) {
        if (this.pdf_db) {
            const embeddings = await this.embeddingFunc.generate(documents);
            await this.pdf_db.add({
                ids: ids,
                documents: documents,
                embeddings: embeddings,
                // metadatas: metas? metas: {},
            });
            return true;
        } else return false;
    }
    async queryPdfSegment(prompt: string, nResults: Number, metas: any = null) {
        if (this.pdf_db) {
            const queryEmbedding = await this.embeddingFunc.generate([prompt]);
            const results = await this.pdf_db.query({
                nResults: nResults,
                queryEmbeddings: queryEmbedding,
                // where: metas? metas: {},
            });
            return results;
        } else return [];
    }
    isValid() {
        return this.pdf_db !== null && this.session_history !== null;
    }
}