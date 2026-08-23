import time
from typing import Literal
from dotenv import load_dotenv
import os
import traceback

load_dotenv()

async def fetch_context_from_vector_db(query: str, customerId: str, workspaceId: str, top_k: int = 5, similarity_threshold: float = 0.6) -> str:
    import importlib
    embedding_pipeline = importlib.import_module("app.controllers.1_embedding_pipeline")
    get_vector_store = embedding_pipeline.get_vector_store
    
    t0 = time.time()
    vc_retriever = get_vector_store(
        top_k=top_k + 8, 
        filter={"customerId": customerId, "workspaceId": workspaceId}
    )
    
    jina_api_key = os.getenv("JINA_API_KEY")
    relevant_docs = []
    
    if jina_api_key:
        try:
            from langchain_community.document_compressors import JinaRerank
            from langchain_classic.retrievers.contextual_compression import ContextualCompressionRetriever
            
            reranker = JinaRerank(
                jina_api_key=jina_api_key, 
                model="jina-reranker-v2-base-multilingual", 
                top_n=top_k
            )
            compression_retriever = ContextualCompressionRetriever(
                base_compressor=reranker, 
                base_retriever=vc_retriever
            )
            print(f"  ↳ [Hybrid Search] Querying Pinecone + Jina Reranker for: '{query}'...")
            t_search = time.time()
            relevant_docs = await compression_retriever.ainvoke(query)
            print(f"  ↳ [Hybrid Search] Retrieved & reranked {len(relevant_docs)} docs in {time.time() - t_search:.2f}s")
        except Exception as jina_err:
            print(f"⚠️ [Jina Rerank Warning] Jina reranker failed ({jina_err}), falling back to direct Pinecone search...")
            try:
                relevant_docs = await vc_retriever.ainvoke(query)
            except Exception as direct_err:
                print(f"❌ [Vector Search Error] Direct Pinecone query failed: {direct_err}")
                print(traceback.format_exc())
                return ""
    else:
        print(f"  ↳ [Hybrid Search] Querying Pinecone directly for: '{query}'...")
        try:
            relevant_docs = await vc_retriever.ainvoke(query)
        except Exception as direct_err:
            print(f"❌ [Vector Search Error] Direct Pinecone query failed: {direct_err}")
            print(traceback.format_exc())
            return ""
    
    # Filter retrieved docs by similarity/relevance score threshold
    filtered_docs = []
    for doc in relevant_docs:
        score = doc.metadata.get("relevance_score", 1.0)
        if score >= similarity_threshold:
            filtered_docs.append(doc.page_content)
        else:
            print(f"  ↳ [Threshold Filter] Skipped chunk with score {score:.2f} < threshold {similarity_threshold}")
    
    if not filtered_docs:
        print(f"  ↳ [Context Result] No chunks matched threshold {similarity_threshold} (total retrieved: {len(relevant_docs)}) in {time.time() - t0:.2f}s")
        return ""

    context = "\n\n".join(filtered_docs)
    print(f"  ↳ [Context Result] Returning {len(filtered_docs)} chunks ({len(context)} chars) in {time.time() - t0:.2f}s")
    return context


    
    