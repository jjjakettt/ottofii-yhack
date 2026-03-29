"""
In-process cancellation flags for long-running action execution.

Used to stop ElevenLabs polling when the user cancels an executing action.
Cleared when a new execution starts for the same action_id.
"""

_cancelled_action_ids: set[str] = set()


def request_cancel(action_id: str) -> None:
    _cancelled_action_ids.add(action_id)


def is_cancelled(action_id: str) -> bool:
    return action_id in _cancelled_action_ids


def clear_cancel(action_id: str) -> None:
    _cancelled_action_ids.discard(action_id)
