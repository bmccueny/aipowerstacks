# Built for the data your other databasescan't touch.

PDFs, images, audio, video, and documents — ingested, embedded, and searchable. No pipeline assembly required.

[Get Started](https://antfly.io/docs) [Learn More](https://antfly.io/blog/dark-data) [View on GitHub](https://github.com/antflydb/antfly)

## See it in action

A simple REST API for hybrid search and RAG pipelines

Create TableHybrid SearchRAG Query

bash

```
1# Create a table with vector embeddings
2curl -X POST http://localhost:8080/tables \
3  -H "Content-Type: application/json" \
4  -d '{
5    "name": "docs",
6    "indexes": [{\
7      "type": "embeddings",\
8      "fields": ["content"],\
9      "embedder": {\
10        "provider": "termite",\
11        "model": "bge-small-en-v1.5"\
12      }\
13    }]
14  }'
```

Why AntflyDB

## Replace thepatchwork

Building AI search means stitching together databases, queues, APIs, and custom code. AntflyDB replaces the entire stack.

Without AntflyDBWith AntflyDB

PostgreSQL

pgvector + pg\_trgm

Self-hosted

Elasticsearch

Full-text search

Self-hosted

Neo4j

Graph database

Self-hosted

OpenAI API

Embedding generation

API key

RAG Agent

Custom orchestrator

Custom code

Cohere API

Reranking service

API key

RabbitMQ

Enrichment queue

Self-hosted

LlamaIndex

Chunking pipeline

Custom code

Amazon S3

Object storage

Managed

Each service requires separate hosting, monitoring, billing, and error handling.

9+

Services

6+

API Keys

20+

Integrations

## One database. Zero glue code.

Embedding, chunking, reranking, and hybrid search — all built in.

### Hybrid Search

BM25 + vector similarity with Reciprocal Rank Fusion. Get the best of both lexical and semantic search.

### Multi-Raft Consensus

Separate consensus groups for metadata and storage. Scale your cluster without bottlenecks.

### Multimodal

Index and search text, images, audio, and video. CLIP embeddings for cross-modal retrieval.

### Local ML Inference

Termite runs embeddings locally with ONNX models. Your data never leaves your infrastructure.

### Kubernetes Native

Official operator with autoscaling, rolling updates, and automated lifecycle management.

### Hardware Accelerated

SIMD optimizations for AVX-512, NEON, and SME. Blazing fast on any architecture.

## From raw files to searchable knowledge

Three commands. No external APIs, no pipeline, no config files.

Step 1

### Install

bash

```
brew install antflydb/antfly/antfly
```

Step 2

### Pull Models

bash

```
antfly termite pull bge-small-en-v1.5
```

Step 3

### Run

bash

```
antfly swarm
```

[Full Quickstart Guide](https://antfly.io/docs/guides/quickstart)

## Termite

Local ML inference

[Open Source](https://github.com/antflydb/termite)

Like Ollama, but for all AI models.Run embeddings, chunking, and reranking locally with ONNX-optimized models.

Embeddings, chunking, reranking

Privacy-preserving, runs locally

Kubernetes native with autoscaling

[Learn More](https://antfly.io/termite)