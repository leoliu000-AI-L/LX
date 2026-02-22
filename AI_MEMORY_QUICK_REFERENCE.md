# AI Agent Memory Systems - Quick Reference Guide

## Quick Decision Tree

```
Need to store conversation history?
├─ Yes → Use ConversationMemory (in-session)
│       └─ Need persistence? → PersistentMemoryStore
└─ No → Need semantic search?
    ├─ Yes → Use VectorMemoryStore or ChromaDB
    │       └─ Large scale (>100K)? → Pinecone/FAISS
    └─ No → Use SimpleMemoryStore or PersistentMemoryStore
```

## Memory Types at a Glance

| Type | Use For | Duration | Example |
|------|---------|----------|---------|
| **Working** | Current task | Session | Active conversation |
| **Episodic** | Events/interactions | Long | "User asked X on date Y" |
| **Semantic** | Facts/knowledge | Permanent | "Python is a language" |
| **Procedural** | Skills/workflows | Permanent | "How to debug code" |

## Framework Comparison

| Framework | Best For | Complexity | Cost |
|-----------|----------|------------|------|
| **ChromaDB** | Prototyping | Low | Free |
| **Pinecone** | Production | Low-Medium | Paid |
| **FAISS** | Batch/Large-scale | Medium | Free |
| **LangChain Memory** | Quick LLM integration | Low | Free |
| **Custom SQLite** | Embedded/Control | Medium | Free |

## Implementation Checklist

### Phase 1: Basic Setup (1-2 hours)
- [ ] Choose memory type based on use case
- [ ] Install dependencies (see below)
- [ ] Create basic memory store
- [ ] Implement add/retrieve functions
- [ ] Test with sample data

### Phase 2: Embeddings (2-3 hours)
- [ ] Choose embedding model
- [ ] Implement embedding generation
- [ ] Add vector search capability
- [ ] Test semantic retrieval
- [ ] Optimize batch processing

### Phase 3: Persistence (1-2 hours)
- [ ] Set up database (SQLite/ChromaDB)
- [ ] Implement save/load functions
- [ ] Add error handling
- [ ] Test data persistence
- [ ] Implement backup strategy

### Phase 4: Advanced Features (3-5 hours)
- [ ] Add importance scoring
- [ ] Implement memory consolidation
- [ ] Add cleanup/forgetting
- [ ] Optimize performance
- [ ] Add monitoring/metrics

## Installation Commands

```bash
# Core dependencies
pip install numpy openai

# Vector databases (choose one)
pip install chromadb                    # Local, easy
pip install pinecone-client             # Managed, production
pip install faiss-cpu                   # Fast, local
pip install faiss-gpu                   # Fast, GPU

# Frameworks (choose one)
pip install langchain                   # LLM integration
pip install llama-index                 # RAG focus

# For production
pip install redis                       # Caching
pip install qdrant-client               # Alternative vector DB
```

## Code Templates

### Basic Memory Store

```python
from ai_memory_code_examples import SimpleMemoryStore

# Create store
memory = SimpleMemoryStore()

# Add memory
memory_id = memory.add(
    content="User prefers Python over JavaScript",
    metadata={"type": "preference", "confidence": 0.9}
)

# Retrieve
result = memory.get(memory_id)
print(result["content"])

# Search
results = memory.search("Python", top_k=3)
for r in results:
    print(f"- {r['content']}")
```

### Vector Store with Embeddings

```python
import openai
from ai_memory_code_examples import VectorMemoryStore
import numpy as np

# Initialize
client = openai.OpenAI()
store = VectorMemoryStore(embedding_dim=1536)

# Generate embedding
def embed(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return np.array(response.data[0].embedding)

# Add memory
content = "AI agents benefit from persistent memory systems"
embedding = embed(content)
store.add(content, embedding, {"topic": "AI"})

# Search
query = "How should AI agents store information?"
query_embedding = embed(query)
results = store.search(query_embedding, top_k=3)

for r in results:
    print(f"Similarity: {r['similarity']:.3f}")
    print(f"Content: {r['memory']['content']}\n")
```

### Persistent Memory

```python
from ai_memory_code_examples import PersistentMemoryStore

# Initialize (creates SQLite database)
store = PersistentMemoryStore("my_agent_memory.db")

# Add different types of memories
store.add(
    content="User is working on machine learning project",
    memory_type="context",
    importance=0.8
)

store.add(
    content="To implement RAG: 1) Create vector store, 2) Add docs, 3) Retrieve",
    memory_type="procedural",
    importance=0.9
)

# Search
results = store.search("machine learning", limit=5)
for r in results:
    print(f"{r['memory_type']}: {r['content']}")

# Get statistics
stats = store.get_stats()
print(f"Total memories: {stats['total_memories']}")
```

### Unified Memory System

```python
from ai_memory_code_examples import UnifiedMemorySystem

# Initialize all memory types
memory = UnifiedMemorySystem("./my_agent_memory")

# Remember an event
memory.remember_episode(
    event_type="user_question",
    content="User asked about implementing RAG systems",
    participants=["user", "agent"],
    outcome="Provided implementation guide"
)

# Learn a fact
memory.learn_fact(
    fact="RAG combines retrieval with generation",
    categories=["AI", "LLM"],
    confidence=0.95
)

# Learn a procedure
memory.learn_procedure(
    name="implement_rag",
    description="Implement a RAG system",
    steps=[
        "Set up vector database",
        "Chunk and embed documents",
        "Implement retrieval function",
        "Create generation prompt"
    ]
)

# Recall information
results = memory.recall("RAG implementation")
print(f"Found {len(results['semantic'])} facts")
print(f"Found {len(results['episodic'])} episodes")

# Conversation memory
memory.add_to_conversation("user", "How do I implement RAG?")
memory.add_to_conversation("assistant", "Here's how...")
context = memory.get_conversation_context()
```

## Common Patterns

### Pattern 1: Conversation with Memory

```python
class ConversationalAgent:
    def __init__(self):
        self.memory = UnifiedMemorySystem()
        self.conversation = ConversationMemory()

    def respond(self, user_message):
        # Add user message
        self.conversation.add_user_message(user_message)

        # Recall relevant information
        relevant = self.memory.recall(user_message)

        # Build context
        context = self._build_context(relevant)

        # Generate response (pseudo-code)
        response = generate_response(
            conversation=self.conversation.get_context(),
            retrieved_context=context
        )

        # Add assistant response
        self.conversation.add_assistant_message(response)

        # Store important information
        if self._is_important(user_message):
            self.memory.remember_episode(
                event_type="interaction",
                content=user_message,
                outcome=response
            )

        return response
```

### Pattern 2: RAG Implementation

```python
class RAGSystem:
    def __init__(self):
        self.vector_store = PersistentMemoryStore()
        self.client = openai.OpenAI()

    def add_documents(self, documents):
        """Add documents to knowledge base."""
        for doc in documents:
            embedding = self._embed(doc)
            self.vector_store.add(doc, embedding)

    def query(self, question, top_k=3):
        """Query with retrieval-augmented generation."""
        # Retrieve relevant documents
        query_embedding = self._embed(question)
        results = self.vector_store.search_similar(
            query_embedding, top_k=top_k
        )

        # Build context
        context = "\n\n".join(r[0]["content"] for r in results)

        # Generate response
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": f"Answer using this context:\n\n{context}\n\nQuestion: {question}"
            }]
        )

        return response.choices[0].message.content
```

### Pattern 3: Memory with Importance

```python
class SmartMemory:
    def __init__(self):
        self.memory = PersistentMemoryStore()
        self.scorer = MemoryScorer()

    def add(self, content, metadata=None):
        """Add with automatic importance scoring."""
        # Calculate initial importance
        importance = self.scorer.score_initial(content, metadata)

        # Add to store
        memory_id = self.memory.add(
            content=content,
            importance=importance,
            metadata=metadata
        )

        return memory_id

    def retrieve(self, query, top_k=5):
        """Retrieve with relevance + importance ranking."""
        results = self.memory.search(query, limit=top_k * 2)

        # Re-rank by combined score
        scored = []
        for r in results:
            relevance = self._calculate_relevance(query, r["content"])
            combined = 0.7 * relevance + 0.3 * r["importance"]
            scored.append((r, combined))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [r for r, _ in scored[:top_k]]
```

## Performance Tips

### 1. Embedding Optimization
```python
# Batch embeddings for efficiency
def batch_embed(texts, batch_size=100):
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        all_embeddings.extend([e.embedding for e in response.data])
    return all_embeddings

# Cache embeddings
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_embedding(text):
    return embed(text)
```

### 2. Search Optimization
```python
# Use filters to reduce search space
results = store.search(
    query="Python",
    memory_type="preference",  # Filter by type
    min_importance=0.7,        # Filter by importance
    limit=10
)

# Pagination for large results
def search_paginated(query, page=1, page_size=20):
    offset = (page - 1) * page_size
    return store.search(query, limit=page_size)[offset:offset+page_size]
```

### 3. Memory Cleanup
```python
# Schedule regular cleanup
import schedule

def cleanup_job():
    deleted = store.cleanup_old_memories(
        days_old=90,
        min_importance=0.3
    )
    print(f"Cleaned up {deleted} old memories")

schedule.every().week.do(cleanup_job)
```

## Cost Estimation

### Embedding Costs (OpenAI)
- `text-embedding-3-small`: $0.02 per 1M tokens
- `text-embedding-3-large`: $0.13 per 1M tokens

**Example**:
```python
def estimate_cost(texts, model="small"):
    chars = sum(len(t) for t in texts)
    tokens = chars / 4  # Rough estimate
    price = 0.02 if model == "small" else 0.13
    return (tokens / 1_000_000) * price

# 1000 documents, avg 500 chars each
cost = estimate_cost(["doc" * 500] * 1000)
print(f"Estimated cost: ${cost:.4f}")
```

### Storage Costs
- ChromaDB: Free (local disk)
- Pinecone: $0.10-0.50 per million vectors
- SQLite: Free (local disk)

## Monitoring

### Key Metrics to Track
```python
def get_metrics(store):
    stats = store.get_stats()

    return {
        "total_memories": stats["total_memories"],
        "avg_importance": stats["avg_importance"],
        "type_distribution": stats["by_type"],
        "total_accesses": stats["total_accesses"],

        # Add custom metrics
        "retrieval_latency": measure_latency(store),
        "storage_size": get_storage_size(store),
        "memory_growth_rate": calculate_growth_rate(store)
    }
```

## Troubleshooting

### Issue: Slow retrieval
**Solutions**:
- Use approximate nearest neighbor (ANN) instead of exact search
- Add database indexes on frequently queried fields
- Implement caching for hot data
- Use pagination for large result sets

### Issue: Poor relevance
**Solutions**:
- Try different embedding models
- Adjust similarity threshold
- Implement re-ranking
- Use hybrid search (keyword + vector)
- Improve chunking strategy

### Issue: High costs
**Solutions**:
- Use smaller embedding model for less critical content
- Implement importance scoring to reduce embeddings
- Cache embeddings to avoid recomputation
- Use local vector stores (FAISS, ChromaDB)
- Batch embedding requests

### Issue: Memory bloat
**Solutions**:
- Implement automatic consolidation
- Add importance-based forgetting
- Archive old memories
- Deduplicate similar memories
- Set size limits per memory type

## Best Practices Summary

1. **Start simple**: Use SimpleMemoryStore or ChromaDB initially
2. **Add embeddings early**: Essential for semantic search
3. **Design for growth**: Plan hierarchical storage from start
4. **Track importance**: Not all memories are equal
5. **Automate maintenance**: Consolidate, deduplicate, archive
6. **Monitor costs**: Embeddings and storage add up
7. **Test retrieval**: Memory is useless if you can't find it
8. **Use appropriate types**: Choose memory type based on content
9. **Implement cleanup**: Don't let memory grow indefinitely
10. **Measure performance**: Track latency, relevance, costs

## Resources

### Documentation
- ChromaDB: https://docs.trychroma.com
- Pinecone: https://docs.pinecone.io
- LangChain: https://python.langchain.com
- FAISS: https://github.com/facebookresearch/faiss/wiki

### Tutorials
- ChromaDB quickstart
- Pinecone getting started
- LangChain memory modules
- RAG implementation guide

### Community
- LangChain Discord
- Pinecone Community Slack
- ChromaDB GitHub Discussions
- Stack Overflow (tags: vector-database, rag)

---

**Version**: 1.0
**Last Updated**: 2026-02-23

For detailed explanations and code, see:
- `AI_AGENT_MEMORY_COMPREHENSIVE_GUIDE.md` - Complete guide
- `ai_memory_code_examples.py` - Ready-to-use implementations
