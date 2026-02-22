"""
RAG (Retrieval-Augmented Generation) Implementation Examples
=============================================================

This file contains practical, production-ready RAG implementations
using different vector databases and approaches.

Author: AI Memory Research
Date: 2026-02-23
"""

import openai
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
from pathlib import Path

# =============================================================================
# 1. SIMPLE RAG WITH CHROMADB
# =============================================================================

class SimpleChromaRAG:
    """
    Simple RAG system using ChromaDB.
    Great for prototyping and small-to-medium applications.
    """

    def __init__(
        self,
        collection_name: str = "rag_documents",
        persist_directory: str = "./chroma_db",
        embedding_model: str = "text-embedding-3-small"
    ):
        import chromadb
        from chromadb.config import Settings

        self.embedding_model = embedding_model
        self.client = openai.OpenAI()

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def _embed(self, text: str) -> List[float]:
        """Generate embedding for text."""
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding

    def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Add documents to the knowledge base.

        Args:
            documents: List of dicts with 'content' and optional 'metadata'

        Returns:
            List of document IDs
        """
        import uuid

        ids = []
        embeddings = []
        contents = []
        metadatas = []

        for doc in documents:
            doc_id = doc.get("id", str(uuid.uuid4()))
            content = doc["content"]
            metadata = doc.get("metadata", {})

            # Generate embedding
            embedding = self._embed(content)

            ids.append(doc_id)
            embeddings.append(embedding)
            contents.append(content)
            metadatas.append(metadata)

        # Add to ChromaDB
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=contents,
            metadatas=metadatas
        )

        return ids

    def query(
        self,
        question: str,
        top_k: int = 3,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query the RAG system.

        Args:
            question: User's question
            top_k: Number of documents to retrieve
            filter_metadata: Optional metadata filter

        Returns:
            Dict with answer and sources
        """
        # Generate query embedding
        query_embedding = self._embed(question)

        # Retrieve relevant documents
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata
        )

        # Build context
        context_parts = []
        sources = []

        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                context_parts.append(doc)
                sources.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0
                })

        context = "\n\n---\n\n".join(context_parts)

        # Generate answer
        answer = self._generate_answer(question, context)

        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "context_used": len(context_parts) > 0
        }

    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using retrieved context."""
        if not context:
            return "I don't have relevant information to answer this question."

        prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {question}

Answer:"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that answers questions based on the provided context."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        return response.choices[0].message.content

    def delete_documents(self, document_ids: List[str]) -> bool:
        """Delete documents by IDs."""
        try:
            self.collection.delete(ids=document_ids)
            return True
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        return {
            "document_count": self.collection.count(),
            "collection_name": self.collection.name
        }


# =============================================================================
# 2. RAG WITH SQLITE (Fully Local)
# =============================================================================

class SQLiteRAG:
    """
    RAG system using SQLite for storage.
    Completely local, no external dependencies needed.
    """

    def __init__(self, db_path: str = "rag_knowledge.db", openai_api_key: str = None):
        self.db_path = db_path
        self.client = openai.OpenAI(api_key=openai_api_key)
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database."""
        import sqlite3

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at
            ON documents(created_at DESC)
        """)

        conn.commit()
        conn.close()

    def _embed(self, text: str) -> List[float]:
        """Generate embedding."""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        """Add documents to knowledge base."""
        import sqlite3
        import pickle
        import uuid

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        ids = []

        for doc in documents:
            doc_id = doc.get("id", str(uuid.uuid4()))
            content = doc["content"]
            metadata = doc.get("metadata", {})

            embedding = self._embed(content)

            cursor.execute("""
                INSERT INTO documents (id, content, embedding, metadata)
                VALUES (?, ?, ?, ?)
            """, (
                doc_id,
                content,
                pickle.dumps(embedding),
                json.dumps(metadata)
            ))

            ids.append(doc_id)

        conn.commit()
        conn.close()

        return ids

    def query(
        self,
        question: str,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """Query the RAG system."""
        import sqlite3
        import pickle

        # Generate query embedding
        query_embedding = self._embed(question)

        # Retrieve similar documents
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT id, content, embedding, metadata FROM documents")
        rows = cursor.fetchall()
        conn.close()

        # Calculate similarities
        results = []
        for row in rows:
            doc_id, content, embedding_blob, metadata_json = row
            doc_embedding = pickle.loads(embedding_blob)

            similarity = self._cosine_similarity(query_embedding, doc_embedding)

            results.append({
                "id": doc_id,
                "content": content,
                "metadata": json.loads(metadata_json),
                "similarity": similarity
            })

        # Sort and take top-k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = results[:top_k]

        # Build context
        context = "\n\n---\n\n".join(r["content"] for r in top_results)

        # Generate answer
        answer = self._generate_answer(question, context)

        return {
            "question": question,
            "answer": answer,
            "sources": top_results,
            "context_used": len(top_results) > 0
        }

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using context."""
        if not context:
            return "I don't have relevant information to answer this question."

        prompt = f"""Context:
{context}

Question: {question}

Answer based on the context above:"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that answers questions based on provided context."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        return response.choices[0].message.content


# =============================================================================
# 3. ADVANCED RAG WITH RE-RANKING
# =============================================================================

class AdvancedRAG:
    """
    Advanced RAG with re-ranking and hybrid search.
    Combines vector search with keyword search and re-ranking.
    """

    def __init__(self, base_store: SimpleChromaRAG):
        self.store = base_store
        self.client = openai.OpenAI()

    def query_with_reranking(
        self,
        question: str,
        initial_k: int = 10,
        final_k: int = 3
    ) -> Dict[str, Any]:
        """
        Query with retrieval and re-ranking.

        Args:
            question: User's question
            initial_k: Number of documents to retrieve initially
            final_k: Number of documents to return after re-ranking

        Returns:
            Dict with answer and sources
        """
        # Step 1: Retrieve more candidates
        query_embedding = self.store._embed(question)

        results = self.store.collection.query(
            query_embeddings=[query_embedding],
            n_results=initial_k
        )

        # Step 2: Re-rank by relevance
        reranked = self._rerank(question, results)

        # Step 3: Use top-k for generation
        top_results = reranked[:final_k]

        # Build context
        context = "\n\n---\n\n".join(r["content"] for r in top_results)

        # Generate answer
        answer = self._generate_answer(question, context, top_results)

        return {
            "question": question,
            "answer": answer,
            "sources": top_results,
            "retrieved_count": len(results["documents"][0]) if results["documents"] else 0,
            "context_used": len(top_results) > 0
        }

    def _rerank(
        self,
        question: str,
        results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Re-rank documents by relevance to question."""
        if not results["documents"] or not results["documents"][0]:
            return []

        scored_docs = []

        for i, doc in enumerate(results["documents"][0]):
            # Use LLM to score relevance
            relevance_score = self._score_relevance(question, doc)

            scored_docs.append({
                "content": doc,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else 0,
                "relevance_score": relevance_score
            })

        # Sort by relevance score
        scored_docs.sort(key=lambda x: x["relevance_score"], reverse=True)

        return scored_docs

    def _score_relevance(self, question: str, document: str) -> float:
        """Score document relevance to question using LLM."""
        prompt = f"""Rate the relevance of this document to the question on a scale of 0.0 to 1.0.

Question: {question}

Document: {document[:500]}

Respond with only a number:"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=10
            )

            score_text = response.choices[0].message.content.strip()
            return float(score_text)
        except:
            return 0.5  # Default score on error

    def _generate_answer(
        self,
        question: str,
        context: str,
        sources: List[Dict[str, Any]]
    ) -> str:
        """Generate answer with citations."""
        if not context:
            return "I don't have relevant information to answer this question."

        # Add source indicators
        numbered_context = ""
        for i, source in enumerate(sources, 1):
            numbered_context += f"[{i}] {source['content']}\n\n"

        prompt = f"""Use the following context to answer the question. Cite your sources using [1], [2], etc.

Context:
{numbered_context}

Question: {question}

Answer:"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that answers questions based on provided context and cites sources."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        return response.choices[0].message.content


# =============================================================================
# 4. HYBRID RAG (Vector + Keyword)
# =============================================================================

class HybridRAG:
    """
    Hybrid RAG combining vector search and keyword search.
    Provides better results for queries with specific terms.
    """

    def __init__(self, vector_store: SimpleChromaRAG):
        self.vector_store = vector_store
        self.keyword_index = {}  # Simple keyword index
        self.client = openai.OpenAI()

    def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        """Add documents to both vector and keyword indexes."""
        # Add to vector store
        ids = self.vector_store.add_documents(documents)

        # Add to keyword index
        for doc, doc_id in zip(documents, ids):
            content = doc["content"]
            self._index_keywords(doc_id, content)

        return ids

    def _index_keywords(self, doc_id: str, content: str):
        """Index keywords for a document."""
        import re

        # Extract words (simple tokenization)
        words = re.findall(r'\b\w+\b', content.lower())

        for word in set(words):
            if len(word) > 3:  # Ignore short words
                if word not in self.keyword_index:
                    self.keyword_index[word] = []
                self.keyword_index[word].append(doc_id)

    def query_hybrid(
        self,
        question: str,
        top_k: int = 3,
        alpha: float = 0.5
    ) -> Dict[str, Any]:
        """
        Query using hybrid search (vector + keyword).

        Args:
            question: User's question
            top_k: Number of results to return
            alpha: Weight for vector search (0-1). 1 = pure vector, 0 = pure keyword

        Returns:
            Dict with answer and sources
        """
        # Vector search
        query_embedding = self.vector_store._embed(question)
        vector_results = self.vector_store.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2
        )

        # Keyword search
        keyword_results = self._keyword_search(question, top_k * 2)

        # Combine scores
        combined = self._combine_results(
            vector_results,
            keyword_results,
            alpha
        )

        # Take top-k
        top_results = combined[:top_k]

        # Generate answer
        context = "\n\n---\n\n".join(r["content"] for r in top_results)
        answer = self._generate_answer(question, context)

        return {
            "question": question,
            "answer": answer,
            "sources": top_results,
            "vector_weight": alpha,
            "keyword_weight": 1 - alpha
        }

    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Search by keywords."""
        import re

        query_words = set(re.findall(r'\b\w+\b', query.lower()))

        # Find documents matching keywords
        doc_scores = {}
        for word in query_words:
            if word in self.keyword_index:
                for doc_id in self.keyword_index[word]:
                    doc_scores[doc_id] = doc_scores.get(doc_id, 0) + 1

        # Get top documents
        sorted_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)
        top_doc_ids = [doc_id for doc_id, _ in sorted_docs[:top_k]]

        # Retrieve full documents
        results = []
        for doc_id in top_doc_ids:
            # Get from vector store (simplified)
            doc_result = self.vector_store.collection.get(
                ids=[doc_id],
                include=["documents", "metadatas"]
            )
            if doc_result["documents"]:
                results.append({
                    "id": doc_id,
                    "content": doc_result["documents"][0],
                    "metadata": doc_result["metadatas"][0] if doc_result["metadatas"] else {},
                    "keyword_score": doc_scores[doc_id]
                })

        return results

    def _combine_results(
        self,
        vector_results: Dict[str, Any],
        keyword_results: List[Dict[str, Any]],
        alpha: float
    ) -> List[Dict[str, Any]]:
        """Combine vector and keyword search results."""
        combined = {}

        # Process vector results
        if vector_results["documents"] and vector_results["documents"][0]:
            for i, doc_id in enumerate(vector_results["ids"][0]):
                combined[doc_id] = {
                    "id": doc_id,
                    "content": vector_results["documents"][0][i],
                    "metadata": vector_results["metadatas"][0][i] if vector_results["metadatas"] else {},
                    "vector_score": 1 - (i / len(vector_results["ids"][0])),  # Normalize
                    "keyword_score": 0
                }

        # Add keyword scores
        for result in keyword_results:
            doc_id = result["id"]
            if doc_id in combined:
                combined[doc_id]["keyword_score"] = result["keyword_score"]
            else:
                combined[doc_id] = {
                    "id": doc_id,
                    "content": result["content"],
                    "metadata": result["metadata"],
                    "vector_score": 0,
                    "keyword_score": result["keyword_score"]
                }

        # Calculate combined score
        for doc_id, doc in combined.items():
            # Normalize scores
            vec_score = doc["vector_score"]
            kw_score = min(doc["keyword_score"] / 10, 1.0)  # Normalize keyword score

            doc["combined_score"] = alpha * vec_score + (1 - alpha) * kw_score

        # Sort by combined score
        results = list(combined.values())
        results.sort(key=lambda x: x["combined_score"], reverse=True)

        return results

    def _generate_answer(self, question: str, context: str) -> str:
        """Generate answer using context."""
        if not context:
            return "I don't have relevant information to answer this question."

        prompt = f"""Context:
{context}

Question: {question}

Answer:"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that answers questions based on provided context."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        return response.choices[0].message.content


# =============================================================================
# 5. RAG WITH CONVERSATION MEMORY
# =============================================================================

class ConversationalRAG:
    """
    RAG system that maintains conversation context.
    Remembers previous questions and answers for follow-up queries.
    """

    def __init__(self, rag_store: SimpleChromaRAG):
        self.rag_store = rag_store
        self.client = openai.OpenAI()
        self.conversation_history = []

    def query(
        self,
        question: str,
        top_k: int = 3,
        use_history: bool = True
    ) -> Dict[str, Any]:
        """
        Query with conversation context.

        Args:
            question: User's question
            top_k: Number of documents to retrieve
            use_history: Whether to use conversation history

        Returns:
            Dict with answer and sources
        """
        # Step 1: Expand query with context
        expanded_query = question
        if use_history and self.conversation_history:
            expanded_query = self._expand_query_with_history(question)

        # Step 2: Retrieve relevant documents
        query_embedding = self.rag_store._embed(expanded_query)
        results = self.rag_store.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        # Step 3: Build context
        context_parts = []
        sources = []

        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                context_parts.append(doc)
                sources.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {}
                })

        context = "\n\n---\n\n".join(context_parts)

        # Step 4: Generate answer with conversation context
        answer = self._generate_answer_with_history(
            question,
            context,
            self.conversation_history if use_history else []
        )

        # Step 5: Update conversation history
        self.conversation_history.append({
            "role": "user",
            "content": question
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": answer
        })

        # Keep only last 10 exchanges
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "expanded_query": expanded_query if use_history else question,
            "conversation_turns": len(self.conversation_history) // 2
        }

    def _expand_query_with_history(self, question: str) -> str:
        """Expand query using conversation history."""
        # Get recent conversation
        recent = self.conversation_history[-6:] if len(self.conversation_history) > 6 else self.conversation_history

        conversation_text = "\n".join([f"{m['role']}: {m['content']}" for m in recent])

        prompt = f"""Given this conversation history, expand the current question to be more specific.

Conversation:
{conversation_text}

Current question: {question}

Expanded question (more specific, incorporating context):"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=100
        )

        return response.choices[0].message.content.strip()

    def _generate_answer_with_history(
        self,
        question: str,
        context: str,
        history: List[Dict[str, str]]
    ) -> str:
        """Generate answer with conversation history."""
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that answers questions based on provided context and conversation history."
            }
        ]

        # Add conversation history
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current question with context
        prompt = f"""Context:
{context}

Question: {question}

Answer:"""

        messages.append({
            "role": "user",
            "content": prompt
        })

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0
        )

        return response.choices[0].message.content

    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []

    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history."""
        return self.conversation_history.copy()


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("RAG Implementation Examples")
    print("=" * 80)

    # Sample documents
    sample_documents = [
        {
            "content": "Python is a high-level programming language known for its simplicity and readability. It's widely used in web development, data science, and AI.",
            "metadata": {"topic": "Python", "category": "programming"}
        },
        {
            "content": "RAG (Retrieval-Augmented Generation) combines retrieval systems with language models to generate responses based on retrieved context.",
            "metadata": {"topic": "RAG", "category": "AI"}
        },
        {
            "content": "Vector databases like ChromaDB, Pinecone, and Weaviate enable efficient semantic search using embeddings.",
            "metadata": {"topic": "Vector Databases", "category": "AI"}
        },
        {
            "content": "LangChain is a framework for building applications with large language models, providing memory, chains, and tools.",
            "metadata": {"topic": "LangChain", "category": "frameworks"}
        }
    ]

    # Example 1: Simple ChromaDB RAG
    print("\n1. Simple ChromaDB RAG:")
    print("-" * 40)

    rag = SimpleChromaRAG(collection_name="demo_docs")
    rag.add_documents(sample_documents)

    result = rag.query("What is RAG?", top_k=2)
    print(f"Question: {result['question']}")
    print(f"Answer: {result['answer'][:200]}...")
    print(f"Sources used: {len(result['sources'])}")

    # Example 2: SQLite RAG (commented out - needs OpenAI API key)
    # print("\n2. SQLite RAG:")
    # print("-" * 40)
    # sqlite_rag = SQLiteRAG(openai_api_key="your-key")
    # sqlite_rag.add_documents(sample_documents)
    # result = sqlite_rag.query("What is Python?")
    # print(f"Answer: {result['answer'][:200]}...")

    # Example 3: Advanced RAG with Re-ranking
    print("\n3. Advanced RAG with Re-ranking:")
    print("-" * 40)

    advanced_rag = AdvancedRAG(rag)
    result = advanced_rag.query_with_reranking(
        "How do vector databases work?",
        initial_k=5,
        final_k=2
    )
    print(f"Question: {result['question']}")
    print(f"Retrieved: {result['retrieved_count']} documents")
    print(f"Re-ranked to: {len(result['sources'])} documents")
    print(f"Answer: {result['answer'][:200]}...")

    # Example 4: Conversational RAG
    print("\n4. Conversational RAG:")
    print("-" * 40)

    conv_rag = ConversationalRAG(rag)

    # First question
    result1 = conv_rag.query("What is LangChain?")
    print(f"Q1: {result1['question']}")
    print(f"A1: {result1['answer'][:150]}...")

    # Follow-up question
    result2 = conv_rag.query("What can it do?")
    print(f"\nQ2: {result2['question']}")
    print(f"A2: {result2['answer'][:150]}...")
    print(f"Conversation turns: {result2['conversation_turns']}")

    print("\n" + "=" * 80)
    print("All examples complete!")
    print("=" * 80)
