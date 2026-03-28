"""
Policy engine — validates actions before execution.
Called by POST /agent/execute before dispatching to any executor.

check_policy() returns:
  { "allowed": True,  "reason": None }
  { "allowed": False, "reason": "..." }
"""

from models import RecurringStream, Action

# Categories that are never actioned — too high risk, regulated, or essential
BLOCKED_CATEGORIES = {
    "payroll",
    "rent",
    "mortgage",
    "insurance",
    "utility",
    "tax",
    "medical",
    "legal",
}


def check_policy(stream: RecurringStream, action: Action) -> dict:
    """
    Validate whether an action is allowed to execute.

    Args:
        stream:  RecurringStream ORM object (the target of the action)
        action:  Action ORM object (the proposed execution)

    Returns:
        dict with keys: allowed (bool), reason (str | None)
    """

    # Rule 1: stream is explicitly protected (IT team marked it)
    if stream.is_protected:
        return {
            "allowed": False,
            "reason": f"'{stream.merchant}' is marked as protected and cannot be actioned.",
        }

    # Rule 2: blocked category (rent, payroll, insurance, etc.)
    if stream.category and stream.category.lower() in BLOCKED_CATEGORIES:
        return {
            "allowed": False,
            "reason": (
                f"Category '{stream.category}' is blocked by policy. "
                f"Essential services are never auto-cancelled."
            ),
        }

    # Rule 3: action must be in approved state
    if action.status != "approved":
        return {
            "allowed": False,
            "reason": (
                f"Action is in state '{action.status}', expected 'approved'. "
                f"Only approved actions can be executed."
            ),
        }

    # Rule 4: confidence too low to act
    confidence = float(stream.confidence) if stream.confidence is not None else 0.0
    if confidence < 0.5:
        return {
            "allowed": False,
            "reason": (
                f"Stream confidence is {confidence:.0%}, below the 50% minimum threshold. "
                f"Requires manual review."
            ),
        }

    return {"allowed": True, "reason": None}
