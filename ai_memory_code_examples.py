"""
AI Agent Memory Systems - Practical Code Examples
==================================================

This file contains ready-to-use implementations of various memory systems
for AI agents, from simple in-memory stores to production-ready solutions.

Author: AI Memory Research
Date: 2026-02-23
"""

import json
import sqlite3
import pickle
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import hashlib
from abc import ABC, abstractmethod
from enum import Enum

# =============================================================================
# 1. SIMPLE IN-MEMORY STORE (For Prototyping)
# =============================================================================

class SimpleMemoryStore:
    """
    Simple in-memory store for quick prototyping.
    Not persistent, but very fast and easy to use.
    """

    def __init__(self):
        self.memories: List[Dict[str, Any]] = []

    def add(self, content: str, metadata: Dict[str, Any] = None) -> str:
        """Add a memory and return its ID."""
        memory_id = hashlib.md5(content.encode()).hexdigest()[:8]
        memory = {
            "id": memory_id,
            "content": content,
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat(),
            "access_count": 0
        }
        self.memories.append(memory)
        return memory_id

    def get(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get a memory by ID."""
        for memory in self.memories:
            if memory["id"] == memory_id:
                memory["access_count"] += 1
                return memory
        return None

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Simple keyword search."""
        query_lower = query.lower()
        results = []

        for memory in self.memories:
            if query_lower in memory["content"].lower():
                memory["access_count"] += 1
                results.append(memory)

        return results[:top_k]

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all memories."""
        return self.memories.copy()

    def clear(self):
        """Clear all memories."""
        self.memories = []


# =============================================================================
# 2. CONVERSATION MEMORY (For Chatbots)
# =============================================================================

class ConversationMemory:
    """
    Memory specifically designed for conversations.
    Maintains dialogue history with context management.
    """

    def __init__(self, max_messages: int = 100, max_tokens: int = 4000):
        self.max_messages = max_messages
        self.max_tokens = max_tokens
        self.messages: List[Dict[str, str]] = []

    def add_user_message(self, message: str):
        """Add a user message."""
        self.messages.append({"role": "user", "content": message})
        self._trim_if_needed()

    def add_assistant_message(self, message: str):
        """Add an assistant message."""
        self.messages.append({"role": "assistant", "content": message})
        self._trim_if_needed()

    def _trim_if_needed(self):
        """Trim messages if we exceed limits."""
        # Check message count
        while len(self.messages) > self.max_messages:
            self.messages.pop(0)

        # Check token count (rough estimation)
        total_tokens = sum(self._estimate_tokens(m["content"]) for m in self.messages)
        while total_tokens > self.max_tokens and len(self.messages) > 2:
            removed = self.messages.pop(0)
            total_tokens -= self._estimate_tokens(removed["content"])

    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation: ~4 characters per token."""
        return len(text) // 4

    def get_context(self, include_system: bool = False) -> List[Dict[str, str]]:
        """Get conversation context for LLM."""
        return self.messages.copy()

    def get_summary(self) -> str:
        """Get a summary of the conversation."""
        if not self.messages:
            return "No conversation history."

        user_msgs = [m for m in self.messages if m["role"] == "user"]
        assistant_msgs = [m for m in self.messages if m["role"] == "assistant"]

        return f"Conversation with {len(user_msgs)} user messages and {len(assistant_msgs)} assistant responses."

    def export_to_dict(self) -> Dict[str, Any]:
        """Export conversation to dictionary."""
        return {
            "messages": self.messages,
            "message_count": len(self.messages),
            "estimated_tokens": sum(self._estimate_tokens(m["content"]) for m in self.messages)
        }


# =============================================================================
# 3. VECTOR MEMORY STORE (For Semantic Search)
# =============================================================================

class VectorMemoryStore:
    """
    Memory store with vector embeddings for semantic search.
    Uses cosine similarity for finding related memories.
    """

    def __init__(self, embedding_dim: int = 1536):
        self.embedding_dim = embedding_dim
        self.memories: List[Dict[str, Any]] = []

    def add(
        self,
        content: str,
        embedding: np.ndarray,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Add a memory with embedding."""
        if len(embedding) != self.embedding_dim:
            raise ValueError(f"Embedding dimension mismatch. Expected {self.embedding_dim}, got {len(embedding)}")

        memory_id = f"vec_{len(self.memories)}_{int(datetime.now().timestamp())}"
        memory = {
            "id": memory_id,
            "content": content,
            "embedding": embedding.astype('float32'),
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat(),
            "access_count": 0
        }
        self.memories.append(memory)
        return memory_id

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_similarity: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search by semantic similarity."""
        if not self.memories:
            return []

        similarities = []
        for memory in self.memories:
            sim = self._cosine_similarity(query_embedding, memory["embedding"])
            if sim >= min_similarity:
                memory["access_count"] += 1
                similarities.append((memory, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return [{"memory": mem, "similarity": sim} for mem, sim in similarities[:top_k]]

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    def find_similar_memories(
        self,
        memory_id: str,
        top_k: int = 5,
        min_similarity: float = 0.8
    ) -> List[Dict[str, Any]]:
        """Find memories similar to a given memory."""
        target_memory = None
        for mem in self.memories:
            if mem["id"] == memory_id:
                target_memory = mem
                break

        if not target_memory:
            return []

        return self.search(target_memory["embedding"], top_k, min_similarity)


# =============================================================================
# 4. PERSISTENT MEMORY STORE (SQLite-based)
# =============================================================================

class PersistentMemoryStore:
    """
    Persistent memory store using SQLite.
    Survives application restarts and supports complex queries.
    """

    def __init__(self, db_path: str = "agent_memory.db"):
        self.db_path = db_path
        self._init_database()

    def _init_database(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create memories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT,
                memory_type TEXT,
                importance REAL DEFAULT 0.5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP,
                access_count INTEGER DEFAULT 0
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at
            ON memories(created_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_importance
            ON memories(importance DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_memory_type
            ON memories(memory_type)
        """)

        conn.commit()
        conn.close()

    def add(
        self,
        content: str,
        memory_type: str = "general",
        embedding: Optional[np.ndarray] = None,
        metadata: Dict[str, Any] = None,
        importance: float = 0.5
    ) -> str:
        """Add a memory to persistent storage."""
        import uuid
        memory_id = str(uuid.uuid4())

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        embedding_blob = pickle.dumps(embedding) if embedding is not None else None
        metadata_json = json.dumps(metadata or {})

        cursor.execute("""
            INSERT INTO memories (id, content, embedding, metadata, memory_type, importance)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (memory_id, content, embedding_blob, metadata_json, memory_type, importance))

        conn.commit()
        conn.close()

        return memory_id

    def get(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get a memory by ID."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, content, embedding, metadata, memory_type, importance,
                   created_at, last_accessed, access_count
            FROM memories
            WHERE id = ?
        """, (memory_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        # Update access count
        self._update_access_count(memory_id)

        return {
            "id": row[0],
            "content": row[1],
            "embedding": pickle.loads(row[2]) if row[2] else None,
            "metadata": json.loads(row[3]),
            "memory_type": row[4],
            "importance": row[5],
            "created_at": row[6],
            "last_accessed": row[7],
            "access_count": row[8]
        }

    def _update_access_count(self, memory_id: str):
        """Update access count and last accessed timestamp."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE memories
            SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (memory_id,))

        conn.commit()
        conn.close()

    def search(
        self,
        query: str,
        memory_type: Optional[str] = None,
        min_importance: float = 0.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search memories by content."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        sql = """
            SELECT id, content, metadata, memory_type, importance,
                   created_at, access_count
            FROM memories
            WHERE content LIKE ? AND importance >= ?
        """
        params = [f"%{query}%", min_importance]

        if memory_type:
            sql += " AND memory_type = ?"
            params.append(memory_type)

        sql += " ORDER BY importance DESC, created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": row[0],
                "content": row[1],
                "metadata": json.loads(row[2]),
                "memory_type": row[3],
                "importance": row[4],
                "created_at": row[5],
                "access_count": row[6]
            }
            for row in rows
        ]

    def search_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        memory_type: Optional[str] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Search by semantic similarity."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        sql = "SELECT id, content, embedding, metadata, importance FROM memories WHERE embedding IS NOT NULL"
        params = []

        if memory_type:
            sql += " AND memory_type = ?"
            params.append(memory_type)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        # Calculate similarities
        results = []
        for row in rows:
            memory_id, content, embedding_blob, metadata_json, importance = row
            stored_embedding = pickle.loads(embedding_blob)

            similarity = self._cosine_similarity(query_embedding, stored_embedding)

            results.append((
                {
                    "id": memory_id,
                    "content": content,
                    "metadata": json.loads(metadata_json),
                    "importance": importance
                },
                similarity
            ))

        # Sort and return top-k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    def get_recent(self, limit: int = 10, memory_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent memories."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        sql = """
            SELECT id, content, metadata, memory_type, importance,
                   created_at, access_count
            FROM memories
        """
        params = []

        if memory_type:
            sql += " WHERE memory_type = ?"
            params.append(memory_type)

        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": row[0],
                "content": row[1],
                "metadata": json.loads(row[2]),
                "memory_type": row[3],
                "importance": row[4],
                "created_at": row[5],
                "access_count": row[6]
            }
            for row in rows
        ]

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

    def cleanup_old_memories(
        self,
        days_old: int = 90,
        min_importance: float = 0.3
    ) -> int:
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

    def get_stats(self) -> Dict[str, Any]:
        """Get memory store statistics."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Total memories
        cursor.execute("SELECT COUNT(*) FROM memories")
        total = cursor.fetchone()[0]

        # By type
        cursor.execute("""
            SELECT memory_type, COUNT(*)
            FROM memories
            GROUP BY memory_type
        """)
        by_type = dict(cursor.fetchall())

        # Average importance
        cursor.execute("SELECT AVG(importance) FROM memories")
        avg_importance = cursor.fetchone()[0] or 0

        # Total accesses
        cursor.execute("SELECT SUM(access_count) FROM memories")
        total_accesses = cursor.fetchone()[0] or 0

        conn.close()

        return {
            "total_memories": total,
            "by_type": by_type,
            "avg_importance": avg_importance,
            "total_accesses": total_accesses
        }


# =============================================================================
# 5. MULTI-TIER MEMORY SYSTEM (Hierarchical)
# =============================================================================

class MemoryTier(Enum):
    WORKING = "working"      # Current session, fast access
    RECENT = "recent"        # Last few sessions
    LONG_TERM = "long_term"  # Persistent storage


class MultiTierMemorySystem:
    """
    Hierarchical memory system with multiple tiers.
    Automatically moves memories between tiers based on access patterns.
    """

    def __init__(self, long_term_db: str = "agent_memory.db"):
        self.working_memory: List[Dict[str, Any]] = []
        self.recent_memory: List[Dict[str, Any]] = []
        self.long_term = PersistentMemoryStore(long_term_db)

        # Tier limits
        self.max_working = 20
        self.max_recent = 100

    def add_to_working(
        self,
        content: str,
        memory_type: str = "general",
        embedding: Optional[np.ndarray] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Add memory to working memory (fastest tier)."""
        memory = {
            "id": f"work_{len(self.working_memory)}_{int(datetime.now().timestamp())}",
            "content": content,
            "memory_type": memory_type,
            "embedding": embedding,
            "metadata": metadata or {},
            "created_at": datetime.now(),
            "access_count": 1
        }

        self.working_memory.append(memory)

        # Move to recent if working memory is full
        if len(self.working_memory) > self.max_working:
            self._consolidate_working_to_recent()

        return memory["id"]

    def _consolidate_working_to_recent(self):
        """Move old working memories to recent."""
        # Move oldest half to recent
        to_move = self.working_memory[:self.max_working // 2]
        self.working_memory = self.working_memory[self.max_working // 2:]

        for memory in to_move:
            # Store embedding in long-term, keep metadata in recent
            if memory["embedding"] is not None:
                self.long_term.add(
                    memory["content"],
                    memory["memory_type"],
                    memory["embedding"],
                    memory["metadata"]
                )

            # Add to recent (without embedding to save memory)
            recent_entry = {
                "id": memory["id"],
                "content": memory["content"],
                "memory_type": memory["memory_type"],
                "metadata": memory["metadata"],
                "created_at": memory["created_at"],
                "access_count": memory["access_count"]
            }
            self.recent_memory.append(recent_entry)

        # Trim recent if needed
        if len(self.recent_memory) > self.max_recent:
            self.recent_memory = self.recent_memory[-self.max_recent:]

    def retrieve(
        self,
        query: str,
        query_embedding: Optional[np.ndarray] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve memories from all tiers."""
        results = []

        # Search working memory (keyword match)
        for memory in self.working_memory:
            if query.lower() in memory["content"].lower():
                memory["access_count"] += 1
                memory["tier"] = "working"
                results.append(memory)

        # Search recent memory (keyword match)
        for memory in self.recent_memory:
            if query.lower() in memory["content"].lower():
                memory["access_count"] += 1
                memory["tier"] = "recent"
                results.append(memory)

        # Search long-term (semantic if embedding provided, else keyword)
        if query_embedding is not None:
            similar = self.long_term.search_similar(query_embedding, top_k)
            for memory, similarity in similar:
                memory["tier"] = "long_term"
                memory["similarity"] = similarity
                results.append(memory)
        else:
            keyword_results = self.long_term.search(query, limit=top_k)
            for memory in keyword_results:
                memory["tier"] = "long_term"
                results.append(memory)

        # Sort by relevance and return top-k
        results.sort(key=lambda x: x.get("similarity", x.get("access_count", 0)), reverse=True)
        return results[:top_k]

    def get_context(self, max_tokens: int = 2000) -> str:
        """Get context from working memory for LLM."""
        context_parts = []
        total_tokens = 0

        for memory in self.working_memory:
            tokens = len(memory["content"]) // 4  # Rough estimate
            if total_tokens + tokens > max_tokens:
                break
            context_parts.append(memory["content"])
            total_tokens += tokens

        return "\n\n".join(context_parts)

    def consolidate_all(self):
        """Force consolidation of all memories to appropriate tiers."""
        while len(self.working_memory) > 0:
            self._consolidate_working_to_recent()

        # Clear recent (all in long-term now)
        self.recent_memory = []


# =============================================================================
# 6. MEMORY WITH IMPORTANCE SCORING
# =============================================================================

class ScoredMemoryStore:
    """
    Memory store that tracks importance scores for each memory.
    Uses importance for retention and retrieval ranking.
    """

    def __init__(self, db_path: str = "scored_memory.db"):
        self.store = PersistentMemoryStore(db_path)

    def add(
        self,
        content: str,
        memory_type: str = "general",
        embedding: Optional[np.ndarray] = None,
        metadata: Dict[str, Any] = None,
        initial_importance: float = 0.5
    ) -> str:
        """Add memory with importance tracking."""
        return self.store.add(
            content=content,
            memory_type=memory_type,
            embedding=embedding,
            metadata=metadata,
            importance=initial_importance
        )

    def boost_importance(self, memory_id: str, amount: float = 0.1) -> bool:
        """Boost importance of a memory."""
        memory = self.store.get(memory_id)
        if not memory:
            return False

        new_importance = min(1.0, memory["importance"] + amount)
        return self.store.update_importance(memory_id, new_importance)

    def decay_importance(self, memory_id: str, amount: float = 0.05) -> bool:
        """Decay importance of a memory."""
        memory = self.store.get(memory_id)
        if not memory:
            return False

        new_importance = max(0.0, memory["importance"] - amount)
        return self.store.update_importance(memory_id, new_importance)

    def get_important_memories(
        self,
        min_importance: float = 0.7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get most important memories."""
        conn = sqlite3.connect(self.store.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, content, metadata, importance, access_count
            FROM memories
            WHERE importance >= ?
            ORDER BY importance DESC, access_count DESC
            LIMIT ?
        """, (min_importance, limit))

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": row[0],
                "content": row[1],
                "metadata": json.loads(row[2]),
                "importance": row[3],
                "access_count": row[4]
            }
            for row in rows
        ]

    def auto_decay_old_memories(self, days_old: int = 7, decay_factor: float = 0.1):
        """Decay importance of old memories."""
        conn = sqlite3.connect(self.store.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE memories
            SET importance = importance * ?
            WHERE created_at < datetime('now', '-' || ? || ' days')
        """, (1 - decay_factor, days_old))

        affected = cursor.rowcount
        conn.commit()
        conn.close()

        return affected


# =============================================================================
# 7. EPISODIC MEMORY (Event-based)
# =============================================================================

class EpisodicMemory:
    """
    Memory system for storing episodes (events, conversations, experiences).
    Each episode has a timestamp, participants, and outcome.
    """

    def __init__(self, db_path: str = "episodic_memory.db"):
        self.db_path = db_path
        self._init_database()

    def _init_database(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS episodes (
                id TEXT PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT,
                participants TEXT,
                content TEXT,
                outcome TEXT,
                metadata TEXT,
                embedding BLOB,
                importance REAL DEFAULT 0.5
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_episode_timestamp
            ON episodes(timestamp DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_event_type
            ON episodes(event_type)
        """)

        conn.commit()
        conn.close()

    def record_episode(
        self,
        event_type: str,
        participants: List[str],
        content: str,
        outcome: str = None,
        metadata: Dict[str, Any] = None,
        embedding: np.ndarray = None,
        importance: float = 0.5
    ) -> str:
        """Record a new episode."""
        import uuid
        episode_id = str(uuid.uuid4())

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO episodes
            (id, event_type, participants, content, outcome, metadata, embedding, importance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            episode_id,
            event_type,
            json.dumps(participants),
            content,
            outcome,
            json.dumps(metadata or {}),
            pickle.dumps(embedding) if embedding else None,
            importance
        ))

        conn.commit()
        conn.close()

        return episode_id

    def get_episodes_by_type(
        self,
        event_type: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get episodes by event type."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, timestamp, event_type, participants, content,
                   outcome, metadata, importance
            FROM episodes
            WHERE event_type = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (event_type, limit))

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": row[0],
                "timestamp": row[1],
                "event_type": row[2],
                "participants": json.loads(row[3]),
                "content": row[4],
                "outcome": row[5],
                "metadata": json.loads(row[6]),
                "importance": row[7]
            }
            for row in rows
        ]

    def get_episodes_with_participant(
        self,
        participant: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get episodes involving a specific participant."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, timestamp, event_type, participants, content, outcome
            FROM episodes
            WHERE participants LIKE ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (f'%"{participant}"%', limit))

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": row[0],
                "timestamp": row[1],
                "event_type": row[2],
                "participants": json.loads(row[3]),
                "content": row[4],
                "outcome": row[5]
            }
            for row in rows
        ]


# =============================================================================
# 8. SEMANTIC MEMORY (Fact-based)
# =============================================================================

class SemanticMemory:
    """
    Memory system for storing facts and knowledge.
    Facts are de-duplicated and can be verified.
    """

    def __init__(self, db_path: str = "semantic_memory.db"):
        self.db_path = db_path
        self._init_database()

    def _init_database(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS facts (
                id TEXT PRIMARY KEY,
                fact TEXT UNIQUE,
                categories TEXT,
                confidence REAL DEFAULT 0.5,
                verification_count INTEGER DEFAULT 0,
                source_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_verified TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_fact_categories
            ON facts(categories)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_confidence
            ON facts(confidence DESC)
        """)

        conn.commit()
        conn.close()

    def learn_fact(
        self,
        fact: str,
        categories: List[str] = None,
        confidence: float = 0.5
    ) -> str:
        """Learn a new fact or update existing."""
        import uuid
        fact_id = hashlib.md5(fact.encode()).hexdigest()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Try to insert new fact
        try:
            cursor.execute("""
                INSERT INTO facts (id, fact, categories, confidence)
                VALUES (?, ?, ?, ?)
            """, (fact_id, fact, json.dumps(categories or []), confidence))

        except sqlite3.IntegrityError:
            # Fact exists, update it
            cursor.execute("""
                UPDATE facts
                SET confidence = (confidence + ?) / 2,
                    source_count = source_count + 1,
                    last_verified = CURRENT_TIMESTAMP
                WHERE fact = ?
            """, (confidence, fact))

        conn.commit()
        conn.close()

        return fact_id

    def get_facts_by_category(
        self,
        category: str,
        min_confidence: float = 0.5
    ) -> List[Dict[str, Any]]:
        """Get facts in a category."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT fact, categories, confidence, source_count, last_verified
            FROM facts
            WHERE categories LIKE ? AND confidence >= ?
            ORDER BY confidence DESC
        """, (f'%"{category}"%', min_confidence))

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "fact": row[0],
                "categories": json.loads(row[1]),
                "confidence": row[2],
                "source_count": row[3],
                "last_verified": row[4]
            }
            for row in rows
        ]

    def search_facts(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search facts by keyword."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT fact, categories, confidence
            FROM facts
            WHERE fact LIKE ?
            ORDER BY confidence DESC
            LIMIT ?
        """, (f"%{query}%", limit))

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "fact": row[0],
                "categories": json.loads(row[1]),
                "confidence": row[2]
            }
            for row in rows
        ]

    def verify_fact(self, fact: str, is_correct: bool) -> bool:
        """Verify a fact as correct or incorrect."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if is_correct:
            # Increase confidence
            cursor.execute("""
                UPDATE facts
                SET confidence = MIN(1.0, confidence + 0.1),
                    verification_count = verification_count + 1,
                    last_verified = CURRENT_TIMESTAMP
                WHERE fact = ?
            """, (fact,))
        else:
            # Decrease confidence or delete if too low
            cursor.execute("""
                UPDATE facts
                SET confidence = MAX(0.0, confidence - 0.2),
                    verification_count = verification_count + 1,
                    last_verified = CURRENT_TIMESTAMP
                WHERE fact = ?
            """, (fact,))

            # Delete very low confidence facts
            cursor.execute("""
                DELETE FROM facts WHERE confidence < 0.2
            """)

        conn.commit()
        affected = cursor.rowcount
        conn.close()

        return affected > 0


# =============================================================================
# 9. PROCEDURAL MEMORY (Skill-based)
# =============================================================================

class ProceduralMemory:
    """
    Memory system for storing procedures and skills.
    Procedures have steps and success rates.
    """

    def __init__(self, db_path: str = "procedural_memory.db"):
        self.db_path = db_path
        self._init_database()

    def _init_database(self):
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS procedures (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE,
                description TEXT,
                steps TEXT,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

    def learn_procedure(
        self,
        name: str,
        description: str,
        steps: List[str]
    ) -> str:
        """Learn a new procedure."""
        import uuid
        proc_id = str(uuid.uuid4())

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO procedures (id, name, description, steps)
                VALUES (?, ?, ?, ?)
            """, (proc_id, name, description, json.dumps(steps)))

        except sqlite3.IntegrityError:
            # Procedure exists, update it
            conn.close()
            return self.get_procedure_by_name(name)["id"]

        conn.commit()
        conn.close()

        return proc_id

    def execute_procedure(self, name: str, success: bool) -> Dict[str, Any]:
        """Record execution of a procedure."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Update stats
        if success:
            cursor.execute("""
                UPDATE procedures
                SET success_count = success_count + 1,
                    last_used = CURRENT_TIMESTAMP
                WHERE name = ?
            """, (name,))
        else:
            cursor.execute("""
                UPDATE procedures
                SET failure_count = failure_count + 1,
                    last_used = CURRENT_TIMESTAMP
                WHERE name = ?
            """, (name,))

        conn.commit()

        # Get updated procedure
        cursor.execute("""
            SELECT id, name, description, steps, success_count, failure_count
            FROM procedures
            WHERE name = ?
        """, (name,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "steps": json.loads(row[3]),
            "success_count": row[4],
            "failure_count": row[5],
            "success_rate": row[4] / (row[4] + row[5]) if (row[4] + row[5]) > 0 else 0
        }

    def get_procedure_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a procedure by name."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, description, steps, success_count, failure_count
            FROM procedures
            WHERE name = ?
        """, (name,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "steps": json.loads(row[3]),
            "success_count": row[4],
            "failure_count": row[5],
            "success_rate": row[4] / (row[4] + row[5]) if (row[4] + row[5]) > 0 else 0
        }

    def get_best_procedures(self, min_success_rate: float = 0.7, limit: int = 10) -> List[Dict[str, Any]]:
        """Get procedures with highest success rates."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, description, steps, success_count, failure_count
            FROM procedures
            WHERE success_count + failure_count >= 3
            ORDER BY CAST(success_count AS REAL) / (success_count + failure_count) DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        procedures = []
        for row in rows:
            success_rate = row[4] / (row[4] + row[5]) if (row[4] + row[5]) > 0 else 0
            if success_rate >= min_success_rate:
                procedures.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "steps": json.loads(row[3]),
                    "success_count": row[4],
                    "failure_count": row[5],
                    "success_rate": success_rate
                })

        return procedures


# =============================================================================
# 10. UNIFIED MEMORY SYSTEM (All-in-One)
# =============================================================================

class UnifiedMemorySystem:
    """
    Complete memory system combining episodic, semantic, and procedural memory.
    Provides a unified interface for all memory operations.
    """

    def __init__(self, base_path: str = "./agent_memory"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

        # Initialize all memory types
        self.episodic = EpisodicMemory(str(self.base_path / "episodic.db"))
        self.semantic = SemanticMemory(str(self.base_path / "semantic.db"))
        self.procedural = ProceduralMemory(str(self.base_path / "procedural.db"))
        self.vector_store = PersistentMemoryStore(str(self.base_path / "vectors.db"))

        # Conversation memory (ephemeral)
        self.conversation = ConversationMemory()

    def remember_episode(
        self,
        event_type: str,
        content: str,
        participants: List[str] = None,
        outcome: str = None,
        embedding: np.ndarray = None
    ) -> str:
        """Store an episodic memory."""
        return self.episodic.record_episode(
            event_type=event_type,
            participants=participants or [],
            content=content,
            outcome=outcome,
            embedding=embedding
        )

    def learn_fact(
        self,
        fact: str,
        categories: List[str] = None,
        confidence: float = 0.5
    ) -> str:
        """Learn a semantic fact."""
        return self.semantic.learn_fact(
            fact=fact,
            categories=categories,
            confidence=confidence
        )

    def learn_procedure(
        self,
        name: str,
        description: str,
        steps: List[str]
    ) -> str:
        """Learn a procedure."""
        return self.procedural.learn_procedure(
            name=name,
            description=description,
            steps=steps
        )

    def recall(self, query: str, query_embedding: np.ndarray = None) -> Dict[str, List]:
        """Recall memories from all systems."""
        results = {
            "episodic": [],
            "semantic": [],
            "procedural": [],
            "vector": []
        }

        # Search episodic
        # (simplified - would need embedding search in production)

        # Search semantic
        results["semantic"] = self.semantic.search_facts(query, limit=5)

        # Search procedural
        # (would match procedure names/descriptions)

        # Search vector store
        if query_embedding is not None:
            results["vector"] = self.vector_store.search_similar(query_embedding, top_k=5)

        return results

    def get_conversation_context(self) -> str:
        """Get current conversation context."""
        return self.conversation.get_context()

    def add_to_conversation(self, role: str, message: str):
        """Add message to conversation."""
        if role == "user":
            self.conversation.add_user_message(message)
        else:
            self.conversation.add_assistant_message(message)

    def get_memory_summary(self) -> Dict[str, Any]:
        """Get summary of all memory systems."""
        return {
            "episodic_episodes": len(self.episodic.get_episodes_by_type("general", limit=1000)),
            "semantic_facts": len(self.semantic.search_facts("", limit=1000)),
            "procedural_count": len(self.procedural.get_best_procedures(min_success_rate=0, limit=1000)),
            "vector_memories": self.vector_store.get_stats()["total_memories"],
            "conversation_messages": len(self.conversation.messages)
        }


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("AI Agent Memory Systems - Usage Examples")
    print("=" * 80)

    # 1. Simple in-memory store
    print("\n1. Simple Memory Store:")
    simple = SimpleMemoryStore()
    simple.add("User prefers Python", {"category": "preference"})
    simple.add("User is working on ML project", {"category": "project"})
    results = simple.search("Python")
    print(f"   Found {len(results)} memories")

    # 2. Conversation memory
    print("\n2. Conversation Memory:")
    conv = ConversationMemory(max_messages=5)
    conv.add_user_message("Hello, how are you?")
    conv.add_assistant_message("I'm doing well, thanks!")
    conv.add_user_message("Can you help with Python?")
    conv.add_assistant_message("Of course! What do you need?")
    print(f"   Conversation has {len(conv.messages)} messages")
    print(f"   Summary: {conv.get_summary()}")

    # 3. Vector memory (with dummy embeddings)
    print("\n3. Vector Memory Store:")
    vec_store = VectorMemoryStore(embedding_dim=128)
    embedding = np.random.rand(128).astype('float32')
    vec_store.add("AI agents need memory systems", embedding, {"topic": "AI"})
    similar = vec_store.search(embedding, top_k=1)
    print(f"   Found {len(similar)} similar memories")

    # 4. Persistent memory
    print("\n4. Persistent Memory Store:")
    persistent = PersistentMemoryStore(":memory:")  # In-memory SQLite for demo
    persistent.add("Important fact about memory systems", "semantic", importance=0.9)
    stats = persistent.get_stats()
    print(f"   Total memories: {stats['total_memories']}")

    # 5. Unified memory system
    print("\n5. Unified Memory System:")
    unified = UnifiedMemorySystem("./demo_memory")

    # Learn different types of memories
    unified.remember_episode(
        event_type="user_interaction",
        content="User asked about RAG systems",
        participants=["user"]
    )

    unified.learn_fact(
        fact="RAG stands for Retrieval-Augmented Generation",
        categories=["AI", "LLM"],
        confidence=0.95
    )

    unified.learn_procedure(
        name="implement_rag",
        description="Implement a RAG system",
        steps=["Create vector store", "Add documents", "Implement retrieval", "Generate responses"]
    )

    summary = unified.get_memory_summary()
    print(f"   Memory summary: {summary}")

    print("\n" + "=" * 80)
    print("Examples complete! All memory systems are ready to use.")
    print("=" * 80)
