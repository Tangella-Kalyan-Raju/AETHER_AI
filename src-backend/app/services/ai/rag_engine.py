import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class MockVectorStore:
    """
    A mock vector store to simulate RAG retrieval without heavy local PyTorch dependencies.
    In a real environment, this would wrap FAISS or ChromaDB with OpenAIEmbeddings.
    """
    def __init__(self):
        self.documents = [
            {"id": "doc1", "title": "Grid Emergency Policy", "content": "During extreme weather events leading to >20% loss of solar, batteries must be discharged before thermal peakers."},
            {"id": "doc2", "title": "Substation Maintenance", "content": "Substation transformers should not exceed 85% load during summer peak hours (14:00 - 18:00)."},
            {"id": "doc3", "title": "Green Mode Directives", "content": "Green Mode prioritizes renewable generation. If renewable is insufficient, utilize energy storage up to 90% Depth of Discharge."}
        ]

    def similarity_search(self, query: str, k: int = 2) -> List[Dict]:
        logger.info(f"[VectorStore] Performing similarity search for query: {query}")
        # Naive keyword search mimicking semantic search
        results = []
        for doc in self.documents:
            if any(word in doc["content"].lower() for word in query.lower().split()):
                results.append(doc)
                
        if not results:
            results = self.documents[:k]
            
        return results[:k]

class RAGEngine:
    def __init__(self):
        self.vector_store = MockVectorStore()
        
    def retrieve_context(self, query: str) -> str:
        """Retrieves relevant enterprise documents for grounding the AI."""
        docs = self.vector_store.similarity_search(query)
        if not docs:
            return "No relevant grid policies found."
            
        context = "RETRIEVED ENTERPRISE POLICIES:\n"
        for d in docs:
            context += f"- [{d['title']}]: {d['content']}\n"
            
        return context
