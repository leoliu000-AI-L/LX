# AI Agent Memory Systems - Comprehensive Guide

## Table of Contents
1. [Memory Architecture Types](#1-memory-architecture-types)
2. [Popular Frameworks and Libraries](#2-popular-frameworks-and-libraries)
3. [Implementation Techniques](#3-implementation-techniques)
4. [Code Examples](#4-code-examples)
5. [Best Practices](#5-best-practices)
6. [Comparison Matrix](#6-comparison-matrix)
7. [Recommended Tools](#7-recommended-tools)

---

## 1. Memory Architecture Types

### 1.1 Short-term Memory (Working Memory)

**Concept**: Temporary storage for current context and immediate processing needs.

**Characteristics**:
- Limited capacity (typically 4-7 items)
- Fast access and manipulation
- Volatile (cleared after session)
- Holds current conversation context
- Manages in-flight tasks and goals

**Use Cases**:
- Conversation history within a session
- Temporary task tracking
- Current user preferences
- Active dialogue state

**Typical Duration**: Minutes to hours

---

### 1.2 Long-term Memory

#### 1.2.1 Episodic Memory
**Concept**: Memory of specific events, experiences, and episodes.

**Characteristics**:
- Time-stamped experiences
- Contextual (who, what, where, when)
- Autobiographical nature
- Rich contextual metadata

**Examples**:
```python
{
  "memory_id": "ep_001",
  "type": "episodic",
  "content": "User asked about Python async/await patterns",
  "timestamp": "2026-02-23T10:30:00Z",
  "context": {
    "session_id": "sess_123",
    "user_sentiment": "confused",
    "resolution": "provided code examples"
  },
  "importance": 0.8
}
```

#### 1.2.2 Semantic Memory
**Concept**: Factual knowledge, concepts, and general information.

**Characteristics**:
- Fact-based (who, what, where)
- Context-independent
- Accumulates over time
- De-duplicated and refined

**Examples**:
```python
{
  "memory_id": "sem_001",
  "type": "semantic",
  "content": "Python async/await uses coroutines for concurrent programming",
  "categories": ["programming", "python", "async"],
  "confidence": 0.95,
  "source_count": 15,
  "last_accessed": "2026-02-23T15:00:00Z"
}
```

#### 1.2.3 Procedural Memory
**Concept**: Knowledge of how to do things, skills, and procedures.

**Characteristics**:
- Action-oriented
- Step-by-step procedures
- Tool usage patterns
- Workflow knowledge

**Examples**:
```python
{
  "memory_id": "proc_001",
  "type": "procedural",
  "skill": "debug_python_code",
  "steps": [
    "Read error message",
    "Identify stack trace",
    "Locate problematic line",
    "Analyze variable states",
    "Apply fix",
    "Verify solution"
  ],
  "success_rate": 0.92,
  "usage_count": 47
}
```

---

### 1.3 Vector Databases and Embeddings

**Concept**: Storing and retrieving memories based on semantic similarity.

**How It Works**:
1. Text is converted to vector embeddings (e.g., OpenAI, Sentence-BERT)
2. Vectors are stored in specialized database
3. Queries are also embedded
4. Similarity search finds nearest vectors (cosine similarity)

**Key Metrics**:
- **Cosine Similarity**: -1 to 1, higher = more similar
- **Euclidean Distance**: Lower = more similar
- **Dot Product**: Higher = more similar (for normalized vectors)

**Popular Embedding Models**:
- OpenAI `text-embedding-3-small` (1536 dimensions)
- OpenAI `text-embedding-3-large` (3072 dimensions)
- Sentence-BERT (384-768 dimensions)
- Cohere Embed (1024 dimensions)

---

### 1.4 Hierarchical Memory Structures

**Concept**: Multi-layered memory organization for efficient retrieval.

**Typical Hierarchy**:
```
┌─────────────────────────────────────┐
│     Working Memory (L1 Cache)       │  ← Fast, limited, current session
├─────────────────────────────────────┤
│     Recent Memory (L2 Cache)        │  ← Last N sessions, frequently accessed
├─────────────────────────────────────┤
│     Long-term Vector Store          │  ← All historical memories, indexed
├─────────────────────────────────────┤
│     Archive/Cold Storage            │  ← Rarely accessed, compressed
└─────────────────────────────────────┘
```

**Benefits**:
- Reduced latency for frequently accessed memories
- Cost optimization (tiered storage)
- Automatic memory lifecycle management
- Scalable to millions of memories

---

## 2. Popular Frameworks and Libraries

### 2.1 MemGPT (Memory-GPT)

**Overview**: Framework for creating agents with sophisticated, hierarchical memory.

**Key Features**:
- Fixed context window management
- Hierarchical memory (working, recent, archival)
- Memory retrieval based on relevance
- Automatic memory consolidation
- Multi-session persistence

**Core Concepts**:
- **Messages**: Fixed-size context windows
- **Memory Blocks**: Persistent memory units
- **Retrieval**: Query-based memory fetching

**Installation**:
```bash
pip install memgpt
```

**Basic Usage**:
```python
from memgpt import Agent, Memory

# Create agent with memory
agent = Agent(
    system_message="You are a helpful assistant.",
    memory=Memory(
        type="vector_store",
        embedding_model="text-embedding-3-small",
        vector_db="chromadb"
    )
)

# Agent automatically manages memory
agent.run("Tell me about our previous conversation")
```

---

### 2.2 AutoGPT's Memory System

**Overview**: Autonomous agent framework with sophisticated memory management.

**Memory Types**:
- **Scratchpad**: Current task working memory
- **Short-term**: Recent thoughts and actions
- **Long-term**: Vector-based persistent memory

**Key Features**:
- Automatic memory consolidation
- Importance-based retention
- Recursive memory summarization
- JSON-based storage

**Memory Structure**:
```python
{
    "scratchpad": "Current task: Research AI memory systems...",
    "short_term": [
        {"thought": "Need to research vector databases", "timestamp": "..."}
    ],
    "long_term": {
        "memories": [
            {"content": "Vector databases enable semantic search...", "score": 0.9}
        ],
        "summaries": [
            {"period": "2026-02-20", "summary": "Focused on RAG systems"}
        ]
    }
}
```

---

### 2.3 LangChain's Memory Modules

**Overview**: Comprehensive memory abstractions for LLM applications.

**Memory Types**:

#### 2.3.1 ConversationBufferMemory
```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory()
memory.save_context({"input": "Hi"}, {"output": "Hello!"})
print(memory.load_memory_variables({}))
# Output: {'history': 'Human: Hi\nAI: Hello!'}
```

**Use Case**: Simple conversations, limited context windows

#### 2.3.2 ConversationBufferWindowMemory
```python
from langchain.memory import ConversationBufferWindowMemory

memory = ConversationBufferWindowMemory(k=3)  # Keep last 3 exchanges
memory.save_context({"input": "First"}, {"output": "Response 1"})
memory.save_context({"input": "Second"}, {"output": "Response 2"})
# Only retains last 3 exchanges
```

**Use Case**: Long conversations with sliding window

#### 2.3.3 ConversationSummaryMemory
```python
from langchain.memory import ConversationSummaryMemory
from langchain.llms import OpenAI

memory = ConversationSummaryMemory(llm=OpenAI(temperature=0))
memory.save_context({"input": "Tell me about AI"}, {"output": "AI is..."})
# Automatically summarizes older exchanges
```

**Use Case**: Very long conversations, needs summarization

#### 2.3.4 VectorStoreMemory
```python
from langchain.memory import VectorStoreMemory
from langchain.vectorstores import Chroma

vectorstore = Chroma(embedding_function=embeddings)
memory = VectorStoreMemory(
    vectorstore=vectorstore,
    memory_key="chat_history",
    input_key="input"
)
```

**Use Case**: Semantic search over conversation history

#### 2.3.5 CombinedMemory
```python
from langchain.memory import CombinedMemory, ConversationBufferMemory

short_term = ConversationBufferMemory(memory_key="short_term")
long_term = VectorStoreMemory(memory_key="long_term")

memory = CombinedMemory(memories=[short_term, long_term])
```

**Use Case**: Multi-layered memory architecture

---

### 2.4 LlamaIndex's Memory Stores

**Overview**: Memory abstractions optimized for RAG and knowledge indexing.

**Key Features**:
- Document stores for structured data
- Vector stores for semantic search
- Graph stores for relationship mapping
- Hybrid retrieval (vector + keyword)

**Memory Store Types**:

#### Document Store
```python
from llama_index.core import Document, VectorStoreIndex
from llama_index.core.storage.docstore import SimpleDocumentStore

docstore = SimpleDocumentStore()
docstore.add_documents([
    Document(text="Memory systems are crucial for AI agents..."),
    Document(text="Vector databases enable semantic similarity...")
])
```

#### Vector Store
```python
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore

index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context,
    show_progress=True
)
```

---

### 2.5 Vector Databases

#### 2.5.1 ChromaDB
```bash
pip install chromadb
```

**Features**:
- Open-source, local-first
- Built-in embedding functions
- Simple API
- Great for prototypes and small-medium deployments

**Pros**:
- Zero-config setup
- Local persistence
- Free and open-source
- Good Python integration

**Cons**:
- Limited horizontal scaling
- Less optimized for billions of vectors

#### 2.5.2 Pinecone
```bash
pip install pinecone-client
```

**Features**:
- Fully managed vector database
- Automatic scaling
- Low latency
- Production-ready

**Pros**:
- Serverless (pay-per-use)
- Excellent performance
- Auto-scaling
- Multi-region replication

**Cons**:
- Proprietary (vendor lock-in)
- Cost for large-scale deployments
- Less control over infrastructure

**Example**:
```python
import pinecone

pinecone.init(api_key="your-key", environment="us-east-1")
index = pinecone.Index("agent-memories")

# Upsert vectors
index.upsert([
    ("mem_001", embedding1, {"type": "episodic", "importance": 0.9}),
    ("mem_002", embedding2, {"type": "semantic", "importance": 0.7})
])

# Query
results = index.query(
    vector=query_embedding,
    top_k=5,
    filter={"type": "episodic"}
)
```

#### 2.5.3 Weaviate
```bash
pip install weaviate-client
```

**Features**:
- Open-source, self-hosted
- GraphQL + REST APIs
- Modular architecture
- Hybrid search (vector + BM25)

**Pros**:
- Flexible deployment
- Rich querying capabilities
- Multi-modal support
- Active community

**Cons**:
- More complex setup
- Requires infrastructure management

#### 2.5.4 Qdrant
```bash
pip install qdrant-client
```

**Features**:
- High-performance
- Filter support
- Payload indexing
- Both client and server modes

---

### 2.6 Local Vector Stores

#### 2.6.1 FAISS (Facebook AI Similarity Search)
```bash
pip install faiss-cpu  # or faiss-gpu for GPU support
```

**Features**:
- In-memory, blazing fast
- Multiple indexing methods (IVF, HNSW, PQ)
- GPU support
- Production-tested at scale

**Example**:
```python
import faiss
import numpy as np

# Create index
dimension = 1536  # OpenAI embedding size
index = faiss.IndexFlatL2(dimension)

# Add vectors
vectors = np.random.random((1000, dimension)).astype('float32')
index.add(vectors)

# Search
D, I = index.search(query_vector, k=5)

# Save index
faiss.write_index(index, "agent_memory.index")
```

#### 2.6.2 hnswlib
```bash
pip install hnswlib
```

**Features**:
- Hierarchical Navigable Small World (HNSW) algorithm
- Very fast approximate search
- Memory-efficient
- Thread-safe

**Example**:
```python
import hnswlib
import numpy as np

# Initialize index
index = hnswlib.Index(space='cosine', dim=1536)
index.init_index(max_elements=10000, ef_construction=200, M=16)

# Add items
index.add_items(vectors, ids)

# Query
labels, distances = index.knn_query(query_vector, k=5)
```

---

## 3. Implementation Techniques

### 3.1 Embedding-based Semantic Search

**Process**:
1. **Chunking**: Split text into manageable pieces
2. **Embedding**: Convert chunks to vectors
3. **Storage**: Store vectors with metadata
4. **Querying**: Embed query and search
5. **Retrieval**: Return top-K similar items

**Chunking Strategies**:

#### Fixed-size Chunking
```python
def chunk_text(text, chunk_size=500, overlap=50):
    """Simple fixed-size chunking with overlap."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

#### Semantic Chunking
```python
def semantic_chunk(text, max_sentences=5):
    """Chunk by semantic boundaries (paragraphs/sentences)."""
    sentences = text.split('. ')
    chunks = []
    current_chunk = []
    for sentence in sentences:
        current_chunk.append(sentence)
        if len(current_chunk) >= max_sentences:
            chunks.append('. '.join(current_chunk))
            current_chunk = []
    if current_chunk:
        chunks.append('. '.join(current_chunk))
    return chunks
```

**Embedding and Search**:
```python
from openai import OpenAI
import numpy as np

client = OpenAI()

def embed_text(text, model="text-embedding-3-small"):
    """Generate embedding for text."""
    response = client.embeddings.create(
        model=model,
        input=text
    )
    return response.data[0].embedding

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def search_memories(query, memories, top_k=5):
    """Search memories by semantic similarity."""
    query_embedding = embed_text(query)

    similarities = []
    for memory in memories:
        similarity = cosine_similarity(query_embedding, memory['embedding'])
        similarities.append((memory, similarity))

    # Sort by similarity and return top-k
    similarities.sort(key=lambda x: x[1], reverse=True)
    return [mem for mem, _ in similarities[:top_k]]
```

---

### 3.2 Context Window Management

**Challenge**: LLMs have limited context windows (4K-128K tokens).

**Strategies**:

#### Strategy 1: Sliding Window
```python
class SlidingWindowMemory:
    def __init__(self, max_tokens=4000):
        self.max_tokens = max_tokens
        self.messages = []

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        self._trim_to_fit()

    def _trim_to_fit(self):
        """Remove oldest messages to fit in context window."""
        total_tokens = sum(self._estimate_tokens(m["content"]) for m in self.messages)

        while total_tokens > self.max_tokens and len(self.messages) > 2:
            removed = self.messages.pop(0)
            total_tokens -= self._estimate_tokens(removed["content"])

    def _estimate_tokens(self, text):
        """Rough estimation: ~4 chars per token."""
        return len(text) // 4

    def get_context(self):
        return self.messages
```

#### Strategy 2: Summarization
```python
from openai import OpenAI

client = OpenAI()

class SummarizingMemory:
    def __init__(self, max_tokens=3000, summarize_threshold=2000):
        self.max_tokens = max_tokens
        self.summarize_threshold = summarize_threshold
        self.messages = []
        self.summary = ""

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        self._manage_memory()

    def _manage_memory(self):
        total_tokens = sum(self._estimate_tokens(m["content"]) for m in self.messages)

        if total_tokens > self.max_tokens:
            # Summarize older messages
            to_summarize = self.messages[:-5]  # Keep last 5 messages
            self.summary = self._create_summary(to_summarize)
            self.messages = self.messages[-5:]

    def _create_summary(self, messages):
        text = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Summarize the conversation concisely."},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content

    def get_context(self):
        context = []
        if self.summary:
            context.append({"role": "system", "content": f"Previous summary: {self.summary}"})
        context.extend(self.messages)
        return context
```

#### Strategy 3: Hierarchical Retrieval
```python
class HierarchicalMemory:
    def __init__(self):
        self.working_memory = []  # Current session
        self.recent_memory = []   # Last few sessions
        self.long_term_memory = VectorStore()  # All history

    def add_memory(self, content, metadata):
        # Add to working memory
        self.working_memory.append({"content": content, "metadata": metadata})

        # Periodically consolidate
        if len(self.working_memory) > 20:
            self._consolidate()

    def _consolidate(self):
        """Move older memories to appropriate storage."""
        # Move oldest to recent
        old_memories = self.working_memory[:10]
        self.recent_memory.extend(old_memories)
        self.working_memory = self.working_memory[10:]

        # Move very old to long-term
        if len(self.recent_memory) > 50:
            very_old = self.recent_memory[:20]
            for mem in very_old:
                embedding = embed_text(mem["content"])
                self.long_term_memory.add(mem["content"], embedding, mem["metadata"])
            self.recent_memory = self.recent_memory[20:]

    def retrieve(self, query, top_k=5):
        # Search all levels
        results = []

        # Search working memory
        results.extend([m for m in self.working_memory if query.lower() in m["content"].lower()])

        # Search recent memory
        results.extend([m for m in self.recent_memory if query.lower() in m["content"].lower()])

        # Search long-term
        vector_results = self.long_term_memory.search(query, top_k)
        results.extend(vector_results)

        return results[:top_k]
```

---

### 3.3 Memory Importance Scoring

**Why**: Not all memories are equally important. Score to optimize retention.

**Scoring Factors**:
1. **Recency**: Recent memories often more relevant
2. **Frequency**: Frequently accessed memories
3. **Semantic Relevance**: Related to current task
4. **User Feedback**: Explicit importance signals
5. **Emotional Content**: Emotionally significant events
6. **Outcome**: Successful/unsuccessful actions

**Implementation**:
```python
from datetime import datetime, timedelta
import numpy as np

class MemoryScorer:
    def __init__(self):
        self.access_counts = {}  # Track access frequency
        self.last_accessed = {}  # Track recency

    def score_memory(self, memory, current_context=None):
        """Calculate importance score for a memory."""
        score = 0.0

        # Factor 1: Recency (0-0.3)
        recency_score = self._recency_score(memory.get("timestamp"))
        score += 0.3 * recency_score

        # Factor 2: Frequency (0-0.25)
        memory_id = memory.get("id")
        freq_score = self._frequency_score(memory_id)
        score += 0.25 * freq_score

        # Factor 3: Semantic relevance (0-0.25)
        if current_context:
            sem_score = self._semantic_score(memory, current_context)
            score += 0.25 * sem_score

        # Factor 4: User feedback (0-0.2)
        feedback_score = memory.get("user_rating", 0.5)
        score += 0.2 * feedback_score

        return min(score, 1.0)

    def _recency_score(self, timestamp):
        """Calculate recency score (exponential decay)."""
        if not timestamp:
            return 0.0

        age = (datetime.now() - timestamp).total_seconds() / 86400  # days
        half_life = 7  # Score halves every week
        decay = np.exp(-np.log(2) * age / half_life)
        return decay

    def _frequency_score(self, memory_id):
        """Calculate frequency score."""
        count = self.access_counts.get(memory_id, 0)
        # Logarithmic scaling
        return min(np.log1p(count) / 5, 1.0)

    def _semantic_score(self, memory, current_context):
        """Calculate semantic similarity to current context."""
        memory_embedding = memory.get("embedding")
        context_embedding = current_context.get("embedding")

        if memory_embedding and context_embedding:
            return cosine_similarity(memory_embedding, context_embedding)
        return 0.0

    def record_access(self, memory_id):
        """Record that a memory was accessed."""
        self.access_counts[memory_id] = self.access_counts.get(memory_id, 0) + 1
        self.last_accessed[memory_id] = datetime.now()
```

---

### 3.4 Forgetting Mechanisms

**Why**: Unlimited memory leads to retrieval degradation and cost bloat.

**Forgetting Strategies**:

#### 1. Decay-based Forgetting
```python
class DecayMemory:
    def __init__(self, half_life_days=30):
        self.half_life = half_life_days
        self.memories = []

    def add_memory(self, memory):
        memory["created_at"] = datetime.now()
        memory["importance"] = memory.get("importance", 0.5)
        self.memories.append(memory)

    def forget(self, retention_rate=0.7):
        """Remove memories based on decay and importance."""
        now = datetime.now()
        surviving_memories = []

        for memory in self.memories:
            age_days = (now - memory["created_at"]).total_seconds() / 86400

            # Decay factor
            decay = np.exp(-np.log(2) * age_days / self.half_life)

            # Survival probability
            survival_prob = memory["importance"] * decay

            if np.random.random() < survival_prob:
                surviving_memories.append(memory)

        self.memories = surviving_memories

    def summarize_and_archive(self, old_memories):
        """Summarize very old memories before deletion."""
        # Group by topic
        topics = {}
        for mem in old_memories:
            topic = mem.get("topic", "general")
            topics.setdefault(topic, []).append(mem)

        summaries = {}
        for topic, mems in topics.items():
            text = " ".join(m["content"] for m in mems)
            summaries[topic] = self._create_summary(text)

        return summaries
```

#### 2.容量-based Forgetting (Capacity-based)
```python
class CapacityMemory:
    def __init__(self, max_memories=1000):
        self.max_memories = max_memories
        self.memories = []
        self.scorer = MemoryScorer()

    def add_memory(self, memory):
        self.memories.append(memory)
        if len(self.memories) > self.max_memories:
            self._evict_worst()

    def _evict_worst(self):
        """Remove lowest-scoring memories."""
        # Score all memories
        scored = [(m, self.scorer.score_memory(m)) for m in self.memories]

        # Sort by score
        scored.sort(key=lambda x: x[1])

        # Remove bottom 10%
        to_remove = int(len(self.memories) * 0.1)
        self.memories = [m for m, _ in scored[to_remove:]]
```

#### 3. Consolidation-based Forgetting
```python
class ConsolidatingMemory:
    def __init__(self):
        this.detailed_memories = []  # Recent, detailed
        self.summarized_memories = []  # Older, summarized
        self.archived_memories = []  # Oldest, compressed

    def consolidate(self):
        """Consolidate memories across tiers."""
        # Detailed -> Summarized
        if len(self.detailed_memories) > 100:
            old_detailed = self.detailed_memories[:50]
            summary = self._create_summary(old_detailed)
            self.summarized_memories.append(summary)
            self.detailed_memories = self.detailed_memories[50:]

        # Summarized -> Archived
        if len(self.summarized_memories) > 200:
            old_summaries = self.summarized_memories[:100]
            archive = self._compress_summaries(old_summaries)
            self.archived_memories.append(archive)
            self.summarized_memories = self.summarized_memories[100:]

    def _create_summary(self, memories):
        """Create summary from detailed memories."""
        # Use LLM to summarize
        pass

    def _compress_summaries(self, summaries):
        """Compress multiple summaries."""
        # Use LLM to find common themes
        pass
```

---

### 3.5 Memory Consolidation

**Concept**: Transform multiple memories into more compact, useful forms.

**Types of Consolidation**:

#### 1. Temporal Consolidation
```python
def temporal_consolidation(memories, time_window="day"):
    """Consolidate memories within time windows."""
    grouped = {}

    for mem in memories:
        timestamp = mem["timestamp"]
        if time_window == "day":
            key = timestamp.date()
        elif time_window == "week":
            key = timestamp.isocalendar()[:2]
        elif time_window == "month":
            key = (timestamp.year, timestamp.month)

        grouped.setdefault(key, []).append(mem)

    # Consolidate each group
    consolidated = {}
    for period, mems in grouped.items():
        consolidated[period] = {
            "count": len(mems),
            "themes": extract_themes(mems),
            "summary": create_summary(mems),
            "key_events": extract_key_events(mems)
        }

    return consolidated
```

#### 2. Semantic Consolidation
```python
def semantic_consolidation(memories, threshold=0.8):
    """Consolidate semantically similar memories."""
    # Cluster memories by similarity
    clusters = []
    used = set()

    for i, mem1 in enumerate(memories):
        if i in used:
            continue

        cluster = [mem1]
        used.add(i)

        for j, mem2 in enumerate(memories[i+1:], i+1):
            if j in used:
                continue

            similarity = cosine_similarity(
                mem1["embedding"],
                mem2["embedding"]
            )

            if similarity > threshold:
                cluster.append(mem2)
                used.add(j)

        if len(cluster) > 1:
            clusters.append(cluster)

    # Create consolidated memories
    consolidated = []
    for cluster in clusters:
        consolidated_mem = {
            "content": merge_cluster_contents(cluster),
            "count": len(cluster),
            "representative_embedding": average_embeddings(cluster),
            "source_ids": [m["id"] for m in cluster]
        }
        consolidated.append(consolidated_mem)

    return consolidated
```

#### 3. Procedural Consolidation
```python
def procedural_consolidation(experiences):
    """Extract procedures from experiences."""
    # Pattern mining to find common sequences
    patterns = {}

    for exp in experiences:
        actions = exp["actions"]
        # Find n-grams
        for n in range(2, min(6, len(actions))):
            for i in range(len(actions) - n + 1):
                pattern = tuple(actions[i:i+n])
                patterns[pattern] = patterns.get(pattern, 0) + 1

    # Extract high-confidence procedures
    procedures = []
    for pattern, count in patterns.items():
        if count >= 3:  # Minimum support
            procedure = {
                "steps": list(pattern),
                "support": count,
                "confidence": count / sum(1 for exp in experiences if _contains(exp, pattern)),
                "success_rate": calculate_success_rate(pattern, experiences)
            }
            procedures.append(procedure)

    return procedures
```

---

### 3.6 Retrieval-Augmented Generation (RAG)

**Concept**: Enhance LLM responses with retrieved context from memory.

**RAG Pipeline**:
```
Query → Embed → Vector Search → Context Assembly → LLM Generation → Response
```

**Implementation**:

#### Basic RAG
```python
from openai import OpenAI

client = OpenAI()

class RAGSystem:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    def query(self, question, top_k=3):
        """Query with RAG."""
        # Step 1: Retrieve relevant context
        context_docs = self.vector_store.search(question, top_k=top_k)

        # Step 2: Assemble prompt with context
        context = "\n\n".join(doc["content"] for doc in context_docs)
        prompt = f"""Context:
{context}

Question: {question}

Answer based on the context above:"""

        # Step 3: Generate response
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context."},
                {"role": "user", "content": prompt}
            ]
        )

        return {
            "answer": response.choices[0].message.content,
            "sources": [doc["id"] for doc in context_docs]
        }
```

#### Advanced RAG with Re-ranking
```python
class AdvancedRAG:
    def __init__(self, vector_store, reranker_model="gpt-4"):
        self.vector_store = vector_store
        self.reranker_model = reranker_model

    def query(self, question, top_k=10, rerank_top=3):
        """Query with retrieval and reranking."""
        # Step 1: Retrieve more candidates
        candidates = self.vector_store.search(question, top_k=top_k)

        # Step 2: Rerank by relevance
        reranked = self._rerank(question, candidates)

        # Step 3: Use top-k for generation
        top_docs = reranked[:rerank_top]

        # Generate response
        context = "\n\n".join(doc["content"] for doc in top_docs)
        # ... (same as basic RAG)

        return response

    def _rerank(self, question, candidates):
        """Rerank documents by relevance."""
        # Use LLM to score relevance
        scores = []
        for doc in candidates:
            score_prompt = f"""Rate the relevance of this document to the question on a scale of 0-1.

Question: {question}

Document: {doc["content"][:500]}

Relevance score:"""

            response = client.chat.completions.create(
                model=self.reranker_model,
                messages=[{"role": "user", "content": score_prompt}],
                temperature=0
            )

            score = float(response.choices[0].message.content.strip())
            scores.append((doc, score))

        # Sort by score
        scores.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in scores]
```

#### Hybrid RAG (Vector + Keyword)
```python
from whoosh.index import open_dir
from whoosh.qparser import QueryParser

class HybridRAG:
    def __init__(self, vector_store, keyword_index_path):
        self.vector_store = vector_store
        self.keyword_index = open_dir(keyword_index_path)

    def query(self, question, alpha=0.5, top_k=5):
        """Hybrid search combining vector and keyword."""
        # Vector search
        vector_results = self.vector_store.search(question, top_k=top_k * 2)
        vector_scores = {doc["id"]: idx for idx, doc in enumerate(vector_results)}

        # Keyword search
        with self.keyword_index.searcher() as searcher:
            parser = QueryParser("content", self.keyword_index.schema)
            query = parser.parse(question)
            keyword_results = searcher.search(query, limit=top_k * 2)
            keyword_scores = {result["id"]: idx for idx, result in enumerate(keyword_results)}

        # Combine scores
        combined_scores = {}
        all_ids = set(vector_scores.keys()) | set(keyword_scores.keys())

        for doc_id in all_ids:
            vec_score = 1 - (vector_scores.get(doc_id, top_k * 2) / (top_k * 2))
            kw_score = 1 - (keyword_scores.get(doc_id, top_k * 2) / (top_k * 2))
            combined_scores[doc_id] = alpha * vec_score + (1 - alpha) * kw_score

        # Get top-k
        sorted_docs = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        return [self._get_doc_by_id(doc_id) for doc_id, _ in sorted_docs[:top_k]]
```

---

## 4. Code Examples

### 4.1 Simple In-Memory Vector Store

```python
import numpy as np
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class MemoryItem:
    id: str
    content: str
    embedding: np.ndarray
    metadata: Dict[str, Any]

class SimpleVectorStore:
    def __init__(self, embedding_dim=1536):
        self.embedding_dim = embedding_dim
        self.memories: List[MemoryItem] = []

    def add(self, content: str, embedding: np.ndarray, metadata: Dict[str, Any] = None) -> str:
        """Add a memory to the store."""
        if len(embedding) != self.embedding_dim:
            raise ValueError(f"Embedding dimension mismatch. Expected {self.embedding_dim}, got {len(embedding)}")

        memory_id = f"mem_{len(self.memories)}_{hash(content) % 10000:04d}"
        memory = MemoryItem(
            id=memory_id,
            content=content,
            embedding=embedding.astype('float32'),
            metadata=metadata or {}
        )
        self.memories.append(memory)
        return memory_id

    def search(self, query_embedding: np.ndarray, top_k: int = 5,
               score_threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search for similar memories."""
        if not self.memories:
            return []

        # Calculate similarities
        similarities = []
        for memory in self.memories:
            similarity = self._cosine_similarity(query_embedding, memory.embedding)
            if similarity >= score_threshold:
                similarities.append((memory, similarity))

        # Sort and return top-k
        similarities.sort(key=lambda x: x[1], reverse=True)
        results = []
        for memory, similarity in similarities[:top_k]:
            results.append({
                "id": memory.id,
                "content": memory.content,
                "similarity": similarity,
                "metadata": memory.metadata
            })

        return results

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def delete(self, memory_id: str) -> bool:
        """Delete a memory by ID."""
        for i, memory in enumerate(self.memories):
            if memory.id == memory_id:
                self.memories.pop(i)
                return True
        return False

    def get(self, memory_id: str) -> Dict[str, Any]:
        """Get a memory by ID."""
        for memory in self.memories:
            if memory.id == memory_id:
                return {
                    "id": memory.id,
                    "content": memory.content,
                    "metadata": memory.metadata
                }
        return None

    def update_metadata(self, memory_id: str, metadata: Dict[str, Any]) -> bool:
        """Update metadata for a memory."""
        for memory in self.memories:
            if memory.id == memory_id:
                memory.metadata.update(metadata)
                return True
        return False

# Usage example
if __name__ == "__main__":
    # Create store
    store = SimpleVectorStore(embedding_dim=1536)

    # Add memories (with dummy embeddings for demo)
    import random
    for i in range(10):
        embedding = np.random.rand(1536).astype('float32')
        store.add(
            content=f"Memory content {i}",
            embedding=embedding,
            metadata={"type": "test", "index": i}
        )

    # Search
    query = np.random.rand(1536).astype('float32')
    results = store.search(query, top_k=3)
    for result in results:
        print(f"{result['id']}: {result['content']} (similarity: {result['similarity']:.3f})")
```

---

### 4.2 ChromaDB Integration

```python
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
import uuid

class ChromaMemoryStore:
    def __init__(self, collection_name="agent_memories", persist_directory="./chroma_db"):
        """Initialize ChromaDB client and collection."""
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_memory(self, content: str, embedding: List[float],
                   metadata: Dict[str, Any] = None) -> str:
        """Add a memory to ChromaDB."""
        memory_id = str(uuid.uuid4())

        self.collection.add(
            ids=[memory_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata or {}]
        )

        return memory_id

    def search_memories(self, query_embedding: List[float],
                        n_results: int = 5,
                        where: Dict[str, Any] = None,
                        where_document: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Search for similar memories."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            where_document=where_document
        )

        # Format results
        formatted = []
        for i, memory_id in enumerate(results['ids'][0]):
            formatted.append({
                'id': memory_id,
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i]  # or 'similarity' depending on config
            })

        return formatted

    def get_memory(self, memory_id: str) -> Dict[str, Any]:
        """Get a specific memory by ID."""
        results = self.collection.get(
            ids=[memory_id],
            include=["documents", "metadatas", "embeddings"]
        )

        if not results['ids']:
            return None

        return {
            'id': results['ids'][0],
            'content': results['documents'][0],
            'metadata': results['metadatas'][0],
            'embedding': results['embeddings'][0]
        }

    def update_memory(self, memory_id: str, content: str = None,
                      metadata: Dict[str, Any] = None) -> bool:
        """Update a memory."""
        try:
            if metadata is not None:
                self.collection.update(
                    ids=[memory_id],
                    metadatas=[metadata]
                )
            # Note: ChromaDB doesn't support updating documents/embeddings directly
            # You'd need to delete and re-add for content/embedding updates
            return True
        except Exception as e:
            print(f"Update failed: {e}")
            return False

    def delete_memory(self, memory_id: str) -> bool:
        """Delete a memory."""
        try:
            self.collection.delete(ids=[memory_id])
            return True
        except Exception as e:
            print(f"Delete failed: {e}")
            return False

    def count_memories(self) -> int:
        """Get total number of memories."""
        return self.collection.count()

# Usage with OpenAI embeddings
import openai

class ChromaWithEmbeddings:
    def __init__(self, openai_api_key: str, collection_name="agent_memories"):
        self.store = ChromaMemoryStore(collection_name)
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.embedding_model = "text-embedding-3-small"

    def _embed(self, text: str) -> List[float]:
        """Generate embedding for text."""
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding

    def add_and_embed(self, content: str, metadata: Dict[str, Any] = None) -> str:
        """Add memory with automatic embedding."""
        embedding = self._embed(content)
        return self.store.add_memory(content, embedding, metadata)

    def search(self, query: str, n_results: int = 5,
               filter: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Search with automatic query embedding."""
        query_embedding = self._embed(query)
        return self.store.search_memories(query_embedding, n_results, where=filter)

# Usage example
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # Initialize
    memory_system = ChromaWithEmbeddings(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        collection_name="my_agent_memories"
    )

    # Add memories
    memory_system.add_and_embed(
        content="User prefers Python for data science tasks",
        metadata={"type": "preference", "category": "programming"}
    )

    memory_system.add_and_embed(
        content="User is working on a machine learning project",
        metadata={"type": "context", "category": "project"}
    )

    # Search
    results = memory_system.search("programming preferences")
    for result in results:
        print(f"Content: {result['content']}")
        print(f"Similarity: {1 - result['distance']:.3f}")
        print(f"Metadata: {result['metadata']}\n")
```

---

### 4.3 LangChain Memory Buffer

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationBufferWindowMemory,
    ConversationSummaryMemory,
    ConversationKGMemory
)
from langchain.chains import ConversationChain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

# 1. Basic Conversation Buffer
def basic_buffer_example():
    """Simple conversation buffer that stores all exchanges."""
    memory = ConversationBufferMemory()

    # Add conversation
    memory.save_context(
        {"input": "Hi, I'm learning about AI memory systems."},
        {"output": "That's fascinating! AI memory is crucial for creating intelligent agents."}
    )

    memory.save_context(
        {"input": "What are the main types?"},
        {"output": "The main types include short-term, long-term, episodic, semantic, and procedural memory."}
    )

    # Load memory
    memory_variables = memory.load_memory_variables({})
    print("Full conversation:")
    print(memory_variables['history'])

# 2. Window Buffer (Sliding Window)
def window_buffer_example():
    """Keep only last N exchanges."""
    memory = ConversationBufferWindowMemory(k=2)

    # Add multiple exchanges
    exchanges = [
        ("What is Python?", "Python is a programming language."),
        ("What about Java?", "Java is also a programming language."),
        ("Tell me about C++", "C++ is a high-performance language."),
        ("And JavaScript?", "JavaScript is used for web development.")
    ]

    for user_input, output in exchanges:
        memory.save_context({"input": user_input}, {"output": output})

    # Only keeps last 2 exchanges
    print("\nWindow memory (last 2 exchanges):")
    print(memory.load_memory_variables({})['history'])

# 3. Summary Memory
def summary_memory_example():
    """Summarize older exchanges to save tokens."""
    from langchain.llms import OpenAI

    llm = OpenAI(temperature=0)
    memory = ConversationSummaryMemory(llm=llm)

    # Add many exchanges
    for i in range(5):
        memory.save_context(
            {"input": f"Question {i+1}"},
            {"output": f"This is answer {i+1} with some additional text to make it longer."}
        )

    # Memory is summarized
    print("\nSummary memory:")
    print(memory.load_memory_variables({})['history'])

# 4. Custom Memory with Importance Scoring
class ImportanceMemory:
    """Custom memory that tracks importance of exchanges."""

    def __init__(self, max_exchanges=10):
        self.exchanges = []
        self.max_exchanges = max_exchanges

    def add_exchange(self, user_input: str, response: str, importance: float = 0.5):
        """Add an exchange with importance score."""
        self.exchanges.append({
            "input": user_input,
            "output": response,
            "importance": importance,
            "timestamp": datetime.now()
        })

        # Sort by importance and keep top exchanges
        self.exchanges.sort(key=lambda x: x['importance'], reverse=True)
        if len(self.exchanges) > self.max_exchanges:
            self.exchanges = self.exchanges[:self.max_exchanges]

    def get_context(self, include_importance=False):
        """Get conversation context."""
        if include_importance:
            return "\n".join(
                f"User: {e['input']}\nAI: {e['output']} (importance: {e['importance']})"
                for e in self.exchanges
            )
        return "\n".join(
            f"User: {e['input']}\nAI: {e['output']}"
            for e in self.exchanges
        )

def custom_memory_example():
    """Use custom importance-based memory."""
    memory = ImportanceMemory(max_exchanges=5)

    # Add exchanges with different importance
    memory.add_exchange(
        "Hi",
        "Hello!",
        importance=0.1
    )

    memory.add_exchange(
        "I need help with my project",
        "I'd be happy to help! What's your project about?",
        importance=0.9
    )

    memory.add_exchange(
        "The weather is nice",
        "Yes, it is!",
        importance=0.2
    )

    memory.add_exchange(
        "My project is about building an AI agent",
        "That sounds exciting! What kind of agent are you building?",
        importance=0.95
    )

    print("\nImportance-weighted memory:")
    print(memory.get_context())

# 5. Memory with Persistence
class PersistentMemory:
    """Memory that persists to disk."""

    def __init__(self, file_path="conversation_history.json"):
        self.file_path = file_path
        self.memory = ConversationBufferMemory()
        self._load()

    def _load(self):
        """Load memory from disk."""
        try:
            import json
            with open(self.file_path, 'r') as f:
                data = json.load(f)
                # Restore messages (simplified example)
                print(f"Loaded {len(data.get('messages', []))} messages from disk")
        except FileNotFoundError:
            print("No existing memory found, starting fresh")

    def _save(self):
        """Save memory to disk."""
        import json
        data = {
            "messages": self.memory.chat_memory.messages
        }
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def save_context(self, inputs, outputs):
        """Save context and persist."""
        self.memory.save_context(inputs, outputs)
        self._save()

    def load_memory_variables(self, variables):
        """Load memory variables."""
        return self.memory.load_memory_variables(variables)

# Run examples
if __name__ == "__main__":
    basic_buffer_example()
    window_buffer_example()
    summary_memory_example()
    custom_memory_example()
```

---

### 4.4 Persistent Memory to Disk/Database

```python
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
import pickle

# 1. JSON-based Persistence
class JSONMemoryStore:
    """Simple JSON file-based memory store."""

    def __init__(self, file_path: str = "agent_memories.json"):
        self.file_path = Path(file_path)
        self.memories = []
        self._load()

    def _load(self):
        """Load memories from JSON file."""
        if self.file_path.exists():
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.memories = json.load(f)
        else:
            self.memories = []

    def _save(self):
        """Save memories to JSON file."""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.memories, f, indent=2, ensure_ascii=False)

    def add(self, content: str, metadata: Dict[str, Any] = None) -> str:
        """Add a memory."""
        memory = {
            "id": f"mem_{len(self.memories)}_{int(datetime.now().timestamp())}",
            "content": content,
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat(),
            "access_count": 0
        }
        self.memories.append(memory)
        self._save()
        return memory["id"]

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Simple keyword search."""
        query_lower = query.lower()
        results = []

        for memory in self.memories:
            if query_lower in memory["content"].lower():
                memory["access_count"] += 1
                results.append(memory)

        self._save()
        return results[:top_k]

    def get(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get memory by ID."""
        for memory in self.memories:
            if memory["id"] == memory_id:
                memory["access_count"] += 1
                self._save()
                return memory
        return None

    def delete(self, memory_id: str) -> bool:
        """Delete memory by ID."""
        for i, memory in enumerate(self.memories):
            if memory["id"] == memory_id:
                self.memories.pop(i)
                self._save()
                return True
        return False

# 2. SQLite-based Persistence
class SQLiteMemoryStore:
    """SQLite-based memory store with vector similarity support."""

    def __init__(self, db_path: str = "agent_memories.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                access_count INTEGER DEFAULT 0,
                importance REAL DEFAULT 0.5
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at
            ON memories(created_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_importance
            ON memories(importance DESC)
        """)

        conn.commit()
        conn.close()

    def add(self, content: str, embedding: Optional[List[float]] = None,
            metadata: Dict[str, Any] = None) -> str:
        """Add a memory to the database."""
        import uuid

        memory_id = str(uuid.uuid4())
        embedding_blob = pickle.dumps(embedding) if embedding else None
        metadata_json = json.dumps(metadata or {})

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO memories (id, content, embedding, metadata)
            VALUES (?, ?, ?, ?)
        """, (memory_id, content, embedding_blob, metadata_json))

        conn.commit()
        conn.close()

        return memory_id

    def search_similar(self, embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar memories using cosine similarity."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get all memories with embeddings
        cursor.execute("SELECT id, content, embedding, metadata, access_count FROM memories WHERE embedding IS NOT NULL")
        rows = cursor.fetchall()

        # Calculate similarities
        results = []
        for row in rows:
            memory_id, content, embedding_blob, metadata_json, access_count = row
            stored_embedding = pickle.loads(embedding_blob)

            similarity = self._cosine_similarity(embedding, stored_embedding)

            results.append({
                "id": memory_id,
                "content": content,
                "metadata": json.loads(metadata_json),
                "similarity": similarity,
                "access_count": access_count
            })

        conn.close()

        # Sort by similarity and return top-k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity."""
        import numpy as np
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def get_recent(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent memories."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, content, metadata, created_at, access_count, importance
            FROM memories
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))

        results = []
        for row in cursor.fetchall():
            results.append({
                "id": row[0],
                "content": row[1],
                "metadata": json.loads(row[2]),
                "created_at": row[3],
                "access_count": row[4],
                "importance": row[5]
            })

        conn.close()
        return results

    def update_importance(self, memory_id: str, importance: float) -> bool:
        """Update importance score for a memory."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE memories
            SET importance = ?
            WHERE id = ?
        """, (importance, memory_id))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    def cleanup_old_memories(self, days_old: int = 90, min_importance: float = 0.3) -> int:
        """Remove old, unimportant memories."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM memories
            WHERE created_at < datetime('now', '-' || ? || ' days')
            AND importance < ?
        """, (days_old, min_importance))

        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        return deleted_count

# 3. Redis-based Persistence (for distributed systems)
class RedisMemoryStore:
    """Redis-based memory store for high-performance scenarios."""

    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        try:
            import redis
            self.redis = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
            self.redis.ping()
        except ImportError:
            raise ImportError("redis package required. Install with: pip install redis")
        except Exception as e:
            raise ConnectionError(f"Could not connect to Redis: {e}")

    def add(self, key: str, content: str, ttl: int = None) -> bool:
        """Add a memory with optional TTL."""
        try:
            if ttl:
                return self.redis.setex(key, ttl, content)
            return self.redis.set(key, content)
        except Exception as e:
            print(f"Redis error: {e}")
            return False

    def get(self, key: str) -> Optional[str]:
        """Get a memory by key."""
        try:
            return self.redis.get(key)
        except Exception as e:
            print(f"Redis error: {e}")
            return None

    def search(self, pattern: str) -> List[str]:
        """Search keys by pattern."""
        try:
            return self.redis.keys(pattern)
        except Exception as e:
            print(f"Redis error: {e}")
            return []

    def add_to_list(self, list_name: str, *values) -> int:
        """Add values to a Redis list."""
        try:
            return self.redis.rpush(list_name, *values)
        except Exception as e:
            print(f"Redis error: {e}")
            return 0

    def get_list_range(self, list_name: str, start: int = 0, end: int = -1) -> List[str]:
        """Get range of values from a list."""
        try:
            return self.redis.lrange(list_name, start, end)
        except Exception as e:
            print(f"Redis error: {e}")
            return []

# Usage examples
if __name__ == "__main__":
    # JSON Store
    print("=== JSON Store ===")
    json_store = JSONMemoryStore("test_memories.json")
    json_store.add("User likes Python programming", {"category": "preference"})
    json_store.add("User is working on ML project", {"category": "project"})
    results = json_store.search("Python")
    print(f"Search results: {results}")

    # SQLite Store
    print("\n=== SQLite Store ===")
    sqlite_store = SQLiteMemoryStore("test_memories.db")
    import numpy as np
    embedding = np.random.rand(1536).tolist()
    mem_id = sqlite_store.add("Test memory content", embedding, {"test": True})
    recent = sqlite_store.get_recent()
    print(f"Recent memories: {recent}")

    # Cleanup old memories
    deleted = sqlite_store.cleanup_old_memories(days_old=365, min_importance=0.2)
    print(f"Deleted {deleted} old memories")
```

---

### 4.5 Memory with Importance Scoring

```python
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
from dataclasses import dataclass, field
from enum import Enum

class MemoryType(Enum):
    EPISODIC = "episodic"
    SEMANTIC = "semantic"
    PROCEDURAL = "procedural"

@dataclass
class ScoredMemory:
    id: str
    content: str
    memory_type: MemoryType
    embedding: Optional[np.ndarray]
    metadata: Dict[str, Any]
    created_at: datetime
    importance: float = 0.5
    access_count: int = 0
    last_accessed: Optional[datetime] = None

    def calculate_importance(self, scorer: 'MemoryScorer') -> float:
        """Calculate importance using the scorer."""
        self.importance = scorer.score(self)
        return self.importance

class MemoryScorer:
    """Score memories based on multiple factors."""

    def __init__(
        self,
        recency_weight: float = 0.3,
        frequency_weight: float = 0.25,
        semantic_weight: float = 0.25,
        explicit_weight: float = 0.2
    ):
        self.recency_weight = recency_weight
        self.frequency_weight = frequency_weight
        self.semantic_weight = semantic_weight
        self.explicit_weight = explicit_weight

        # Track access patterns
        self.access_history: Dict[str, List[datetime]] = {}

    def score(self, memory: ScoredMemory, current_context: Optional[str] = None) -> float:
        """Calculate overall importance score (0-1)."""
        score = 0.0

        # Recency score (exponential decay)
        recency_score = self._recency_score(memory.created_at)
        score += self.recency_weight * recency_score

        # Frequency score (logarithmic)
        freq_score = self._frequency_score(memory.id, memory.access_count)
        score += self.frequency_weight * freq_score

        # Semantic relevance score
        if current_context and memory.embedding is not None:
            sem_score = self._semantic_relevance(memory, current_context)
            score += self.semantic_weight * sem_score

        # Explicit importance (from metadata or user feedback)
        explicit_score = memory.metadata.get("importance", memory.importance)
        score += self.explicit_weight * explicit_score

        return min(score, 1.0)

    def _recency_score(self, created_at: datetime, half_life_days: int = 7) -> float:
        """Calculate recency score with exponential decay."""
        age = (datetime.now() - created_at).total_seconds() / 86400
        decay = np.exp(-np.log(2) * age / half_life_days)
        return decay

    def _frequency_score(self, memory_id: str, access_count: int) -> float:
        """Calculate frequency score (logarithmic scaling)."""
        # Record this access
        if memory_id not in self.access_history:
            self.access_history[memory_id] = []
        self.access_history[memory_id].append(datetime.now())

        # Logarithmic scaling: more accesses = diminishing returns
        return min(np.log1p(access_count) / 5, 1.0)

    def _semantic_relevance(self, memory: ScoredMemory, context: str) -> float:
        """Calculate semantic relevance to current context."""
        # This would typically use embeddings
        # Simplified version checks for keyword overlap
        content_words = set(memory.content.lower().split())
        context_words = set(context.lower().split())

        if not context_words:
            return 0.0

        overlap = len(content_words & context_words)
        return min(overlap / len(context_words), 1.0)

    def record_access(self, memory_id: str):
        """Record that a memory was accessed."""
        if memory_id not in self.access_history:
            self.access_history[memory_id] = []
        self.access_history[memory_id].append(datetime.now())

class ImportanceMemoryStore:
    """Memory store that uses importance scoring for retention and retrieval."""

    def __init__(
        self,
        max_memories: int = 1000,
        scorer: Optional[MemoryScorer] = None,
        embedding_dim: int = 1536
    ):
        self.max_memories = max_memories
        self.scorer = scorer or MemoryScorer()
        self.embedding_dim = embedding_dim
        self.memories: Dict[str, ScoredMemory] = {}

    def add(
        self,
        content: str,
        memory_type: MemoryType,
        embedding: Optional[np.ndarray] = None,
        metadata: Optional[Dict[str, Any]] = None,
        initial_importance: float = 0.5
    ) -> str:
        """Add a new memory."""
        # Generate ID
        memory_id = f"mem_{len(self.memories)}_{int(datetime.now().timestamp())}"

        # Create memory object
        memory = ScoredMemory(
            id=memory_id,
            content=content,
            memory_type=memory_type,
            embedding=embedding,
            metadata=metadata or {},
            created_at=datetime.now(),
            importance=initial_importance
        )

        # Calculate importance
        memory.calculate_importance(self.scorer)

        # Add to store
        self.memories[memory_id] = memory

        # Evict if over capacity
        if len(self.memories) > self.max_memories:
            self._evict_worst()

        return memory_id

    def _evict_worst(self, eviction_rate: float = 0.1):
        """Remove lowest-importance memories."""
        # Score all memories
        scored_memories = [
            (mem_id, mem.importance)
            for mem_id, mem in self.memories.items()
        ]

        # Sort by importance
        scored_memories.sort(key=lambda x: x[1])

        # Remove bottom N%
        to_remove = int(len(self.memories) * eviction_rate)
        for mem_id, _ in scored_memories[:to_remove]:
            del self.memories[mem_id]

        print(f"Evicted {to_remove} low-importance memories")

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        memory_type: Optional[MemoryType] = None,
        min_importance: float = 0.0
    ) -> List[ScoredMemory]:
        """Retrieve memories by relevance and importance."""
        # Filter by type and importance
        candidates = []
        for memory in self.memories.values():
            if memory_type and memory.memory_type != memory_type:
                continue
            if memory.importance < min_importance:
                continue
            candidates.append(memory)

        # Score by query relevance
        scored_candidates = []
        for memory in candidates:
            relevance = self._query_relevance(query, memory)
            # Combine relevance and importance
            combined_score = 0.7 * relevance + 0.3 * memory.importance
            scored_candidates.append((memory, combined_score))

        # Sort and return top-k
        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        # Update access counts
        for memory, _ in scored_candidates[:top_k]:
            memory.access_count += 1
            memory.last_accessed = datetime.now()
            self.scorer.record_access(memory.id)

        return [mem for mem, _ in scored_candidates[:top_k]]

    def _query_relevance(self, query: str, memory: ScoredMemory) -> float:
        """Calculate query relevance for a memory."""
        # Simple keyword overlap (would use embeddings in practice)
        query_words = set(query.lower().split())
        content_words = set(memory.content.lower().split())

        if not query_words:
            return 0.5  # Neutral if no query

        overlap = len(query_words & content_words)
        return min(overlap / len(query_words), 1.0)

    def update_importance(self, memory_id: str, delta: float) -> bool:
        """Adjust importance score for a memory."""
        if memory_id not in self.memories:
            return False

        memory = self.memories[memory_id]
        memory.importance = max(0.0, min(1.0, memory.importance + delta))
        return True

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the memory store."""
        if not self.memories:
            return {"total_memories": 0}

        memories_list = list(self.memories.values())

        return {
            "total_memories": len(memories_list),
            "avg_importance": np.mean([m.importance for m in memories_list]),
            "min_importance": min(m.importance for m in memories_list),
            "max_importance": max(m.importance for m in memories_list),
            "type_distribution": {
                mem_type.value: sum(1 for m in memories_list if m.memory_type == mem_type)
                for mem_type in MemoryType
            },
            "total_accesses": sum(m.access_count for m in memories_list),
            "avg_accesses": np.mean([m.access_count for m in memories_list])
        }

    def forget_low_importance(self, threshold: float = 0.2, max_age_days: int = 30) -> int:
        """Remove memories below importance threshold and older than max_age_days."""
        cutoff_date = datetime.now() - timedelta(days=max_age_days)
        to_remove = []

        for memory_id, memory in self.memories.items():
            if memory.importance < threshold and memory.created_at < cutoff_date:
                to_remove.append(memory_id)

        for memory_id in to_remove:
            del self.memories[memory_id]

        return len(to_remove)

# Usage example
if __name__ == "__main__":
    # Create memory store with scorer
    scorer = MemoryScorer(
        recency_weight=0.3,
        frequency_weight=0.25,
        semantic_weight=0.25,
        explicit_weight=0.2
    )

    store = ImportanceMemoryStore(
        max_memories=100,
        scorer=scorer
    )

    # Add different types of memories
    store.add(
        "User asked about Python async programming",
        MemoryType.EPISODIC,
        metadata={"user_rating": 0.9},
        initial_importance=0.8
    )

    store.add(
        "Python async/await uses coroutines for concurrent programming",
        MemoryType.SEMANTIC,
        metadata={"verified": True},
        initial_importance=0.9
    )

    store.add(
        "Steps to debug Python code: 1) Read error, 2) Check stack trace, 3) Fix issue",
        MemoryType.PROCEDURAL,
        metadata={"success_rate": 0.95},
        initial_importance=0.85
    )

    # Retrieve memories
    results = store.retrieve("Python programming", top_k=3)
    print("\nRetrieved memories:")
    for mem in results:
        print(f"- {mem.memory_type.value}: {mem.content} (importance: {mem.importance:.2f})")

    # Get statistics
    stats = store.get_statistics()
    print("\nMemory statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Simulate aging and cleanup
    print("\nForgetting low-importance memories...")
    forgotten = store.forget_low_importance(threshold=0.5, max_age_days=1)
    print(f"Forgot {forgotten} memories")
```

---

## 5. Best Practices

### 5.1 When to Use Different Memory Types

| Memory Type | Use Case | Duration | Example |
|-------------|----------|----------|---------|
| **Working Memory** | Current task, active dialogue | Session | Current conversation context |
| **Short-term Memory** | Recent sessions, frequently accessed | Hours-Days | User's recent questions |
| **Episodic Memory** | Specific events, interactions | Months-Years | "User had trouble with X on date Y" |
| **Semantic Memory** | Facts, knowledge, concepts | Permanent | "Python is a programming language" |
| **Procedural Memory** | Skills, workflows, procedures | Permanent | "How to debug code" |

**Decision Tree**:
```
Is this temporary/active task?
├─ Yes → Working Memory
└─ No → Is this about how to do something?
    ├─ Yes → Procedural Memory
    └─ No → Is this a specific event/conversation?
        ├─ Yes → Episodic Memory
        └─ No → Semantic Memory (facts/knowledge)
```

---

### 5.2 How to Structure Memories

#### Memory Schema Design
```python
# Recommended memory structure
memory_schema = {
    # Identification
    "id": "unique_identifier",
    "type": "episodic|semantic|procedural",

    # Content
    "content": "Main content text",
    "summary": "Brief summary (for older memories)",

    # Embeddings (for vector search)
    "embedding": [float_array],  # Optional but recommended

    # Metadata
    "metadata": {
        "source": "user|agent|system",
        "category": "preference|fact|procedure",
        "tags": ["tag1", "tag2"],
        "confidence": 0.95,
        "user_rating": 0.9,  # Optional user feedback
        "linked_entities": ["entity1", "entity2"]
    },

    # Timestamps
    "created_at": "2026-02-23T10:00:00Z",
    "last_accessed": "2026-02-23T15:30:00Z",
    "last_modified": "2026-02-23T11:00:00Z",

    # Importance tracking
    "importance": 0.8,  # 0-1
    "access_count": 15,

    # Relationships
    "related_memories": ["mem_id_1", "mem_id_2"],
    "parent_memory": "parent_id"  # For consolidated memories
}
```

#### Indexing Strategy
```python
# What to index for fast retrieval
recommended_indexes = {
    # Temporal indexes
    "created_at": "B-tree index for range queries",
    "last_accessed": "For recency-based retrieval",

    # Importance indexes
    "importance": "For top-N important memories",

    # Type indexes
    "type": "For filtering by memory type",

    # Vector index
    "embedding": "HNSW/IVF for semantic search",

    # Full-text search
    "content": "Full-text index for keyword search",

    # Metadata indexes
    "metadata.category": "For category filtering",
    "metadata.tags": "For tag-based retrieval"
}
```

---

### 5.3 Memory Cleanup and Maintenance

#### Automated Maintenance Tasks

**1. Regular Consolidation**
```python
def schedule_consolidation(store, interval_days=7):
    """Consolidate old detailed memories into summaries."""
    while True:
        time.sleep(interval_days * 86400)  # Convert to seconds
        store.consolidate_old_memories(days_old=interval_days)
```

**2. Importance Recalculation**
```python
def recalculate_importance(store, scorer):
    """Periodically recalculate importance scores."""
    for memory in store.get_all_memories():
        new_score = scorer.score(memory)
        store.update_importance(memory.id, new_score)
```

**3. Deduplication**
```python
def deduplicate_memories(store, similarity_threshold=0.95):
    """Remove duplicate or near-duplicate memories."""
    memories = store.get_all_memories()
    to_remove = set()

    for i, mem1 in enumerate(memories):
        if mem1.id in to_remove:
            continue
        for mem2 in memories[i+1:]:
            if mem2.id in to_remove:
                continue

            similarity = cosine_similarity(
                mem1.embedding,
                mem2.embedding
            )

            if similarity > similarity_threshold:
                # Keep the more important one
                to_remove.add(mem2.id if mem2.importance < mem1.importance else mem1.id)

    for mem_id in to_remove:
        store.delete(mem_id)
```

**4. Archive Old Memories**
```python
def archive_old_memories(store, age_days=90):
    """Move very old memories to cold storage."""
    cutoff = datetime.now() - timedelta(days=age_days)
    old_memories = store.get_memories_older_than(cutoff)

    # Move to archive
    for memory in old_memories:
        archive_store.add(memory)
        store.delete(memory.id)
```

---

### 5.4 Performance Optimization

#### Vector Search Optimization

**1. Use Approximate Nearest Neighbor (ANN)**
```python
# For large-scale stores (>100K vectors)
# Use HNSW instead of exact search
import hnswlib

index = hnswlib.Index(space='cosine', dim=1536)
index.init_index(max_elements=100000, ef_construction=200, M=16)
# Much faster than FAISS IndexFlatL2 for large datasets
```

**2. Embedding Caching**
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_embedding(text):
    """Cache embeddings to avoid recomputation."""
    return embed_text(text)
```

**3. Batch Processing**
```python
def batch_embed(texts, batch_size=100):
    """Embed texts in batches for efficiency."""
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        batch_embeddings = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        ).data
        embeddings.extend([e.embedding for e in batch_embeddings])
    return embeddings
```

#### Database Optimization

**1. Connection Pooling**
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'sqlite:///agent_memories.db',
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

**2. Query Optimization**
```python
# Use pagination for large result sets
def search_memories(query, page=1, page_size=20):
    offset = (page - 1) * page_size
    return db.query(
        "SELECT * FROM memories WHERE content LIKE ? LIMIT ? OFFSET ?",
        (f"%{query}%", page_size, offset)
    )
```

**3. Async Operations**
```python
import asyncio
import asyncpg

async def async_add_memory(pool, content, embedding):
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memories (content, embedding) VALUES ($1, $2)",
            content, embedding
        )
```

---

### 5.5 Cost Considerations

#### Embedding Costs

**OpenAI Embeddings Pricing (2026)**:
- `text-embedding-3-small`: ~$0.02 per 1M tokens
- `text-embedding-3-large`: ~$0.13 per 1M tokens

**Cost Optimization Strategies**:
```python
def estimate_embedding_cost(texts, model="text-embedding-3-small"):
    """Estimate cost for embedding texts."""
    # Token estimation: ~4 chars per token
    total_chars = sum(len(text) for text in texts)
    total_tokens = total_chars / 4

    if model == "text-embedding-3-small":
        cost_per_million = 0.02
    elif model == "text-embedding-3-large":
        cost_per_million = 0.13
    else:
        raise ValueError(f"Unknown model: {model}")

    cost = (total_tokens / 1_000_000) * cost_per_million
    return cost

# Use smaller model for less critical content
def choose_embedding_model(content):
    """Choose embedding model based on content importance."""
    if content.get("importance", 0.5) > 0.7:
        return "text-embedding-3-large"
    return "text-embedding-3-small"
```

#### Vector Database Costs

**Comparison**:
| Database | Cost Model | Best For |
|----------|------------|----------|
| **ChromaDB** | Free (self-hosted) | Development, small-medium scale |
| **FAISS** | Free (in-memory) | Large-scale, batch processing |
| **Pinecone** | $0.10-0.50 per million vectors | Production, managed service |
| **Weaviate** | Free (self-hosted) | Custom deployments |
| **Qdrant** | Free (self-hosted) | Production, self-managed |

**Cost Optimization**:
```python
def tiered_storage_strategy(memory):
    """Choose storage tier based on access patterns."""
    if memory["access_count"] > 100:  # Hot data
        return "redis"  # Fast, in-memory
    elif memory["importance"] > 0.7:  # Warm data
        return "pinecone"  # Fast vector search
    else:  # Cold data
        return "faiss_disk"  # Cheap disk-based storage
```

---

## 6. Comparison Matrix

### Memory System Comparison

| Feature | Simple Vector Store | ChromaDB | Pinecone | FAISS | SQLite + Vectors |
|---------|-------------------|----------|----------|-------|------------------|
| **Setup Complexity** | Low | Low | Medium | Low | Medium |
| **Scalability** | < 10K | < 1M | Unlimited | Unlimited | < 100K |
| **Performance** | Medium | Good | Excellent | Excellent | Good |
| **Persistence** | Manual | Built-in | Built-in | Manual | Built-in |
| **Cost** | Free | Free | Paid | Free | Free |
| **Best For** | Prototypes | Small apps | Production | Batch | Embedded |

### Framework Comparison

| Framework | Memory Types | Persistence | RAG Support | Learning Curve |
|-----------|--------------|-------------|-------------|----------------|
| **MemGPT** | Hierarchical | Yes | Yes | Medium |
| **AutoGPT** | Scratch + Long | JSON | Basic | High |
| **LangChain** | Multiple options | Yes | Excellent | Low |
| **LlamaIndex** | Document + Vector | Yes | Excellent | Medium |
| **Custom** | Fully custom | Depends | Depends | High |

---

## 7. Recommended Tools

### By Use Case

#### 1. Quick Prototyping
- **ChromaDB**: Zero-config, local, easy API
- **LangChain Memory**: Quick integration with LLMs
- **Simple dict/list**: For very simple cases

#### 2. Production Systems
- **Pinecone**: Managed, scalable, reliable
- **Weaviate**: Self-hosted, feature-rich
- **Qdrant**: High performance, flexible

#### 3. Large-Scale Batch Processing
- **FAISS**: Fastest, memory-efficient
- **hnswlib**: Excellent performance, smaller memory footprint

#### 4. Edge/Embedded
- **SQLite + custom vectors**: Simple, embedded
- **ChromaDB (local mode)**: Full features, local only

#### 5. Distributed Systems
- **Redis**: For caching/hot data
- **Pinecone**: For global distribution
- **Weaviate**: Multi-node clustering

---

## Summary and Recommendations

### Quick Start Path
1. **Beginner**: Start with ChromaDB + LangChain Memory
2. **Intermediate**: Build custom memory store with SQLite + FAISS
3. **Advanced**: Deploy multi-tier system with Redis + Pinecone + custom logic

### Key Takeaways
1. **Start simple**: Don't over-engineer initially
2. **Use embeddings**: Essential for semantic memory
3. **Design for growth**: Plan hierarchical storage from the start
4. **Track importance**: Not all memories are equal
5. **Automate maintenance**: Consolidate, deduplicate, archive
6. **Monitor costs**: Embeddings and vector DBs add up
7. **Test retrieval**: Memory is useless if you can't find it

### Common Pitfalls to Avoid
- Storing everything without importance scoring
- Using exact search for large vector stores (use ANN)
- Not planning for memory cleanup/forgetting
- Ignoring retrieval latency in user-facing apps
- Over-relying on semantic search (combine with keyword)
- Not persisting frequently accessed memories

---

## Additional Resources

### Libraries to Explore
- `mem0ai`: Modern memory framework for AI agents
- `semantic-kernel`: Microsoft's memory abstraction
- `dspy`: Framework for programmatic memory
- `haystack`: Deep learning for semantic search

### Reading
- "Attention Is All You Need" (Transformer architecture)
- "Retrieval-Augmented Generation for Large Language Models"
- "MemGPT: Towards LLMs as Operating Systems"
- "Language Models as Agent Memories"

### Communities
- LangChain Discord
- Pinecone Community
- ChromaDB GitHub Discussions
- AI Agent Builders Slack

---

**Document Version**: 1.0
**Last Updated**: 2026-02-23
**Author**: AI Agent Memory Research

This document provides a comprehensive foundation for building and understanding memory systems for AI agents. Start with the basics, iterate based on your specific needs, and scale as your requirements grow.
