import inspect
from datetime import datetime, timezone
from functools import wraps
import time
from langchain_core.messages import AIMessage


def observable_node(node_name):

    def decorator(func):
        is_async = inspect.iscoroutinefunction(func)
        
        def log_entry(state):
            query_preview = ""
            if isinstance(state, dict) and "query" in state and state["query"]:
                q = str(state["query"][-1])
                query_preview = f" | Query: '{q[:50]}...'" if len(q) > 50 else f" | Query: '{q}'"
            print(f"🔵 [Agent Trajectory] ▶ Entering Node: [{node_name}]{query_preview}")

        def log_exit(final_result, duration, token_usage):
            details = []
            if isinstance(final_result, dict):
                if "route" in final_result and final_result["route"]:
                    details.append(f"route='{final_result['route'][-1]}'")
                if "query_type" in final_result and final_result["query_type"]:
                    details.append(f"type='{final_result['query_type']}'")
                if "current_context" in final_result:
                    ctx = final_result.get("current_context")
                    if ctx:
                        details.append(f"ctx_len={len(ctx)}")
                    else:
                        details.append("ctx=None")
                if "remarks" in final_result and final_result["remarks"]:
                    details.append(f"remarks='{final_result['remarks']}'")
                if "messages" in final_result and final_result["messages"]:
                    last_msg = final_result["messages"][-1]
                    if hasattr(last_msg, "content"):
                        msg_preview = str(last_msg.content).strip().replace('\n', ' ')
                        preview = (msg_preview[:60] + "...") if len(msg_preview) > 60 else msg_preview
                        details.append(f"output='{preview}'")

            tokens_str = ""
            if token_usage:
                if isinstance(token_usage, dict):
                    tokens_str = f" | Tokens: {token_usage.get('total_tokens', token_usage)}"
                elif hasattr(token_usage, "total_tokens"):
                    tokens_str = f" | Tokens: {token_usage.total_tokens}"

            detail_str = f" | {', '.join(details)}" if details else ""
            print(f"🟢 [Agent Trajectory] ✔ Completed Node: [{node_name}] in {duration}ms{detail_str}{tokens_str}")

        def process_result(result, start, start_iso):
            duration = int((time.time() - start) * 1000)
            token_usage = None
            
            candidates = []
            if isinstance(result, dict):
                if "node_output" in result and result["node_output"]:
                    candidates.append(result["node_output"][-1])
                if "messages" in result and result["messages"]:
                    candidates.append(result["messages"][-1])
            
            for candidate in candidates:
                if hasattr(candidate, "usage_metadata") and candidate.usage_metadata:
                    token_usage = candidate.usage_metadata 
                    break
                elif hasattr(candidate, "response_metadata") and isinstance(candidate.response_metadata, dict):
                    token_usage = candidate.response_metadata.get("token_usage")
                    if token_usage:
                        break

            final_result = {k: v for k, v in result.items() if k != "trajectory"}

            log_exit(final_result, duration, token_usage)

            trajectory_event = {
                "node": node_name,
                "start_time": start_iso,
                "end_time": datetime.now(timezone.utc).isoformat(),
                "duration_ms": duration,
                "tokens": token_usage,
                "node_output": final_result.get("node_output", [None])[0] if final_result.get("node_output") else None
            }

            return {
                **final_result,
                "trajectory": [trajectory_event],
                "error_messages": [{"node": node_name, "type": None, "message": None}]
            }
            
        def process_error(e, start, start_iso):
            duration = int((time.time() - start) * 1000)
            print(f"🔴 [Agent Trajectory] ✖ Failed Node: [{node_name}] after {duration}ms | {type(e).__name__}: {e}")
            error_event = {
                "node": node_name,
                "start_time": start_iso,
                "end_time": datetime.now(timezone.utc).isoformat(),
                "duration_ms": duration,
                "error": str(e)
            }
            return {
                "trajectory": [error_event],
                "messages": [AIMessage(
                    content=f"SYSTEM OBSERVATION:\nPrevious node failed.\nNode: {node_name}\nError: {str(e)}\nChoose another strategy."
                )],
                "error_messages": [{
                    "node": node_name,
                    "type": type(e).__name__,
                    "message": str(e)
                }]
            }

        if is_async:
            @wraps(func)
            async def async_wrapper(state, config):
                log_entry(state)
                start = time.time()
                start_iso = datetime.now(timezone.utc).isoformat()
                try:
                    result = await func(state, config)
                    return process_result(result, start, start_iso)
                except Exception as e:
                    return process_error(e, start, start_iso)
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(state, config):
                log_entry(state)
                start = time.time()
                start_iso = datetime.now(timezone.utc).isoformat()
                try:
                    result = func(state, config)
                    return process_result(result, start, start_iso)
                except Exception as e:
                    return process_error(e, start, start_iso)
            return sync_wrapper

    return decorator