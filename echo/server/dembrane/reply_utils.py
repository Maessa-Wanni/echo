from logging import getLogger

import litellm
from pydantic import BaseModel

from dembrane.prompts import render_prompt
from dembrane.directus import directus
from dembrane.anthropic import count_tokens_anthropic

logger = getLogger("reply_utils")


class Conversation(BaseModel):
    id: str
    transcript: str
    name: str
    tags: list[str]


def format_conversation(conversation: Conversation) -> str:
    """Format a single conversation into XML-like string format."""
    return (
        "<conversation>\n"
        f"	<name>{conversation.name}</name>\n"
        f"	<tags>{', '.join(conversation.tags)}</tags>\n"
        f"	<transcript>{conversation.transcript}</transcript>\n"
        "</conversation>\n"
    )


def build_conversation_transcript(conversation: dict) -> str:
    # Create a list of all content (chunks and replies) with timestamps
    conversation_content = []
    for chunk in conversation["chunks"]:
        if chunk["transcript"] is not None:
            conversation_content.append(
                {
                    "timestamp": chunk["timestamp"],
                    "content": str(chunk["transcript"]),
                    "type": "transcript",
                }
            )

    if "replies" in conversation:
        for reply in conversation["replies"]:
            conversation_content.append(
                {
                    "timestamp": reply["date_created"],
                    "content": str(reply["content_text"]),
                    "type": "reply",
                }
            )

    # Sort all content by timestamp
    conversation_content.sort(key=lambda x: x["timestamp"])

    # Build the transcript with interleaved replies
    transcript = ""
    for item in conversation_content:
        if item["type"] == "transcript":
            transcript += f"{item['content']}\n"
        elif item["type"] == "reply":
            transcript += f"[Assistant Reply at this point in time: {item['content']}]\n"
        else:
            logger.error(f"Unknown item type: {item['type']}")
            transcript += f"[Unknown item type: {item['type']}]\n"

    logger.debug(f"The Transcript: {transcript}")

    return transcript


def generate_reply_for_conversation(conversation_id: str, language: str) -> dict:
    # might need to just use audio directly here
    conversation = directus.get_items(
        "conversation",
        {
            "query": {
                "filter": {"id": conversation_id},
                "limit": 1,
                "fields": [
                    "id",
                    "project_id",
                    "chunks.id",
                    "chunks.timestamp",
                    "chunks.transcript",
                    "project_id.id",
                    "project_id.name",
                    "project_id.is_get_reply_enabled",
                    "project_id.get_reply_prompt",
                    "project_id.context",
                    "tags.project_tag_id.text",
                    "participant_name",
                    "replies.id",
                    "replies.date_created",
                    "replies.content_text",
                    "replies.type",
                ],
                "deep": {
                    # actual order
                    "chunks": {"_sort": ["timestamp"], "_limit": 10000},
                    "replies": {"_sort": ["date_created"], "_limit": 1000},
                },
            },
        },
    )

    if len(conversation) == 0:
        raise ValueError(f"Conversation {conversation_id} not found")

    logger.info(f"Conversation: {conversation}")

    conversation = conversation[0]

    if conversation["project_id"]["is_get_reply_enabled"] is False:
        raise ValueError(f"Get reply is not enabled for project {conversation['project_id']['id']}")

    current_conversation = Conversation(
        id=conversation["id"],
        name=conversation["participant_name"],
        transcript=build_conversation_transcript(conversation),
        tags=[
            tag["project_tag_id"]["text"]
            for tag in conversation["tags"]
            if tag["project_tag_id"]["text"] is not None
        ],
    )

    current_project = {
        "id": conversation["project_id"]["id"],
        "name": conversation["project_id"]["name"],
        "description": conversation["project_id"]["context"],
        "get_reply_prompt": conversation["project_id"]["get_reply_prompt"],
    }

    adjacent_conversations = directus.get_items(
        "conversation",
        {
            "query": {
                "filter": {
                    "id": {"_neq": current_conversation.id},
                    "project_id": {"_eq": conversation["project_id"]["id"]},
                },
                "fields": [
                    "id",
                    "chunks.id",
                    "chunks.timestamp",
                    "chunks.transcript",
                    "participant_name",
                    "tags.project_tag_id.text",
                    "replies.id",
                    "replies.date_created",
                    "replies.content_text",
                    "replies.type",
                ],
                "deep": {
                    # reverse chronological order
                    "chunks": {"_sort": ["-timestamp"], "_limit": 1000},
                    "replies": {"_sort": ["-date_created"], "_limit": 1000},
                },
            }
        },
    )

    adjacent_conversation_transcripts: list[Conversation] = []  # noqa
    total_tokens = 0
    token_limit = 40000
    target_tokens_per_conv = 2000  # Target size for each conversation

    # First pass: truncate all conversations to target size
    candidate_conversations = []
    for conversation in adjacent_conversations:
        # Create conversation with tags
        c = Conversation(
            id=conversation["id"],
            name=conversation["participant_name"],
            transcript=build_conversation_transcript(conversation),
            tags=[
                tag["project_tag_id"]["text"]
                for tag in conversation["tags"]
                if tag["project_tag_id"]["text"] is not None
            ],
        )

        # First check tokens for this conversation
        formatted_conv = format_conversation(c)
        tokens = count_tokens_anthropic(formatted_conv)

        # If conversation is too large, truncate it
        if tokens > target_tokens_per_conv:
            # Rough approximation: truncate based on token ratio
            truncation_ratio = target_tokens_per_conv / tokens
            truncated_transcript = c.transcript[: int(len(c.transcript) * truncation_ratio)]
            c.transcript = truncated_transcript + "\n[Truncated for brevity...]"
            formatted_conv = format_conversation(c)
            tokens = count_tokens_anthropic(formatted_conv)

        candidate_conversations.append((formatted_conv, tokens))

    # Second pass: add as many conversations as possible
    formatted_conversations = []
    for formatted_conv, tokens in candidate_conversations:
        if total_tokens + tokens <= token_limit:
            formatted_conversations.append(formatted_conv)
            total_tokens += tokens
        else:
            break

    logger.debug(f"Total tokens for adjacent conversations: {total_tokens}")
    logger.debug(f"Number of adjacent conversations included: {len(formatted_conversations)}")

    formatted_adjacent_conversation = ""
    for formatted_conv in formatted_conversations:
        formatted_adjacent_conversation += formatted_conv

    formatted_current_conversation = format_conversation(current_conversation)

    prompt = render_prompt(
        "get_reply",
        language,
        {
            "PROJECT_DESCRIPTION": current_project["description"]
            if current_project["description"] is not None
            else "",
            "GLOBAL_PROMPT": current_project["get_reply_prompt"]
            if current_project["get_reply_prompt"] is not None
            else "",
            "OTHER_TRANSCRIPTS": formatted_adjacent_conversation,
            "MAIN_USER_TRANSCRIPT": formatted_current_conversation,
        },
    )

    response = litellm.completion(
        model="anthropic/claude-3-5-sonnet-20240620",
        # api_key=ANTHROPIC_API_KEY,
        messages=[
            {"role": "user", "content": prompt},
            # prefill with a placeholder response
            {"role": "assistant", "content": "<detailed_analysis>"},
        ],
    )

    response = response.choices[0].message.content

    logger.debug(f"The Full Response: {response}")

    # delete everything between <detailed_analysis> tags / general clean up
    response = response.split("</detailed_analysis>")[1]
    response = str(response).replace("<response>", "").replace("</response>", "").strip()

    # create a reply
    created_reply_object = directus.create_item(
        "conversation_reply",
        item_data={
            "conversation_id": current_conversation.id,
            "content_text": response,
            "type": "assistant_reply",
        },
    )["data"]

    return created_reply_object


if __name__ == "__main__":
    print(generate_reply_for_conversation("96e43879-17eb-40db-95a5-5247f7d7759e", "en"))
