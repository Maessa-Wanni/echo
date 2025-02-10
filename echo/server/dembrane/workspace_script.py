# mypy: ignore-errors
# ruff: noqa

import litellm
from directus_sdk_py import DirectusClient  # type: ignore

from dembrane.prompts import render_prompt

rw_token = "eSV-4seFO3Qi2l0wlokvMwyXoLUT_xGk"
r_token = "eSV-4seFO3Qi2l0wlokvMwyXoLUT_xGk"
directus = DirectusClient(url="https://directus.dembrane.com", token=r_token)
directus_rw = DirectusClient(url="https://directus.dembrane.com", token=rw_token)


def select_representative_conversations_and_add_to_new_project() -> None:
    """
    1) Get (or create) the master project named "Oikocredit R1 Main".
    2) For each project associated with joost (ignoring conversations tagged with '(no_tag)'):
        a) Find representative conversations by grouping them according to their tags and
           choosing the conversation with the largest wordcount in each group.
        b) Create or retrieve a 'Representative' tag for the project.
        c) Add that tag to each determined representative conversation in the project.
    """

    from collections import defaultdict

    # 0) Lookup existing or create master project
    master_name = "Oikocredit R1 Main"
    existing_master = directus.get_items(
        "project", {"query": {"filter": {"name": {"_eq": master_name}}}}
    )

    if existing_master:
        master_project = existing_master[0]
        print(f"Master project '{master_name}' already exists (ID={master_project['id']}).")
    else:
        print("creating master project")
        print("actually we exit here")
        exit()
        # Uncomment below to actually create the new master project
        # master_project = directus_rw.create_item("project", {"name": master_name})
        # print(f"Created new master project '{master_name}' (ID={master_project['id']}).")

    # 1) Fetch all user projects
    projects = directus.get_items(
        "project",
        {
            "query": {
                "fields": ["id", "name"],
                "filter": {
                    "directus_user_id": {"email": {"_contains": "joost"}},
                },
                "sort": "created_at",
                "search": "| Break",
            }
        },
    )

    print("found ", len(projects), " projects for user joost")

    for project in projects:
        pid = project["id"]
        project_name = project["name"]
        print(f"\n=== Processing project '{project_name}' (ID={pid}) ===")

        # 2) Fetch only conversations with transcripts for this project
        conversations = directus.get_items(
            "conversation",
            {
                "query": {
                    "filter": {
                        "project_id": pid,
                        "chunks": {"_some": {"transcript": {"_nempty": True}}},
                    },
                    "fields": [
                        "id",
                        "participant_name",
                        "tags.project_tag_id.id",
                        "tags.project_tag_id.text",
                    ],
                }
            },
        )
        print(
            f"Fetched {len(conversations)} conversation(s) with transcripts for project '{project_name}'."
        )

        # 3) Group conversations by each tag
        #    A single conversation can appear in multiple groups if it has multiple tags.
        groups_by_tag = defaultdict(list)
        for conv in conversations:
            tags_in_conv = conv.get("tags", [])
            if not tags_in_conv:
                groups_by_tag["(no_tag)"].append(conv)
            else:
                for tag_info in tags_in_conv:
                    tag_text = tag_info.get("project_tag_id", {}).get("text", "(unknown_tag)")
                    groups_by_tag[tag_text].append(conv)

        # 3b) For each group, compute transcripts and find the conversation with the maximum word count
        representative_conversations = []
        for tag_text, convs_in_group in groups_by_tag.items():
            # If the tag is "(no_tag)" or "(unknown_tag)", we might skip (according to user instructions: ignoring no name).
            # If you truly want to skip them, use:
            if tag_text in ("(no_tag)", "(unknown_tag)"):
                print(f"  Skipping group '{tag_text}'")
                continue

            print(f"\n  Tag Group: '{tag_text}' has {len(convs_in_group)} conversation(s).")

            representative_conv = None
            representative_word_count = 0

            for conv in convs_in_group:
                conv_id = conv["id"]
                # Fetch conversation chunks
                chunks = directus.get_items(
                    "conversation_chunk",
                    {
                        "query": {
                            "filter": {"conversation_id": {"_eq": conv_id}},
                            "sort": "timestamp",
                            "limit": 100000,
                        }
                    },
                )

                # Build transcript
                full_transcript = []
                for chunk in chunks:
                    txt = chunk.get("transcript", "")
                    if txt is not None:
                        full_transcript.append(txt)

                joined_transcript = " ".join(full_transcript)
                word_count = len(joined_transcript.split())

                if word_count > representative_word_count:
                    representative_word_count = word_count
                    representative_conv = {
                        "conversation_id": conv_id,
                        "participant_name": conv["participant_name"],
                        "transcript": joined_transcript,
                        "word_count": word_count,
                    }

            if representative_conv:
                print(
                    f"    Representative Conversation ID={representative_conv['conversation_id']}, "
                    f"Participant='{representative_conv['participant_name']}', Word Count={representative_conv['word_count']}"
                )
                representative_conversations.append(representative_conv["conversation_id"])
            else:
                print("    No representative conversation found in this group.")

        # 4) Create (or retrieve) a 'Representative' tag for the project
        #    We'll assume you want a new instance each time or you want to reuse if it exists:
        existing_rep_tag = directus.get_items(
            "project_tag",
            {"query": {"filter": {"project_id": pid, "text": {"_eq": "Representative"}}}},
        )

        if existing_rep_tag:
            rep_tag_id = existing_rep_tag[0]["id"]
            print(f"Reusing existing 'Representative' tag (ID={rep_tag_id}) in project {pid}.")
        else:
            rep_tag = directus_rw.create_item(
                "project_tag", {"project_id": pid, "text": "Representative"}
            )["data"]
            rep_tag_id = rep_tag["id"]
            print(
                f"Created new 'Representative' tag (ID={rep_tag_id}) for project '{project_name}'."
            )

        # 5) Update each representative conversation to include the newly created 'Representative' tag
        for conv_id in representative_conversations:
            # Check if it already has the 'Representative' tag:
            conv_data = directus.get_items(
                "conversation",
                {
                    "query": {
                        "filter": {"id": {"_eq": conv_id}},
                        "fields": ["id", "tags.project_tag_id.id", "tags.project_tag_id.text"],
                    }
                },
            )

            conv_data = conv_data[0]

            print("debug:", conv_data)
            existing_tags = conv_data.get("tags", [])

            already_has_rep = any(
                t.get("project_tag_id", {}).get("id") == rep_tag_id for t in existing_tags
            )

            if already_has_rep:
                print(f"  Conversation {conv_id} already has 'Representative' tag; skipping.")
                continue

            updated_conv = directus_rw.update_item(
                "conversation", conv_id, {"tags": {"create": [{"project_tag_id": rep_tag_id}]}}
            )
            print(f"  Conversation {conv_id} updated with 'Representative' tag (ID={rep_tag_id}).")

    print(
        "\nDone selecting representative conversations and adding them to the new 'Representative' tag."
    )


print("starting")
# select_representative_conversations_and_add_to_new_project()
print("done")


def copy_conversation_to_new_project(conversation_id: str, new_project_id: str) -> None:
    conversation_data = directus.get_items(
        "conversation",
        {
            "query": {
                "filter": {"id": {"_eq": conversation_id}},
                "fields": [
                    "id",
                    "created_at",
                    "participant_name",
                    "participant_user_agent",
                    "chunks.id",
                    "chunks.path",
                    "chunks.created_at",
                    "chunks.transcript",
                    "chunks.timestamp",
                    "project_id.name",
                    "tags.project_tag_id.id",
                    "tags.project_tag_id.text",
                ],
            }
        },
    )

    conversation = conversation_data[0]

    print(
        "debug: found conversation",
        conversation["participant_name"],
        "in project",
        conversation["project_id"]["name"],
    )

    if conversation is None:
        print(f"Conversation {conversation_id} not found")
        return

    print("source conversation:", conversation["participant_name"])

    destination_project = directus.get_item("project", new_project_id)

    chunks = []

    for chunk in conversation["chunks"]:
        chunks.append(
            {
                "path": chunk["path"],
                "created_at": chunk["created_at"],
                "transcript": chunk["transcript"],
                "timestamp": chunk["timestamp"],
            }
        )

    all_tags = conversation["tags"]

    tags_without_representative = [
        tag for tag in all_tags if tag["project_tag_id"]["text"] != "Representative"
    ]

    tags_to_create = []

    for tag in tags_without_representative:
        tags_to_create.append({"project_tag_id": {"text": tag["project_tag_id"]["text"]}})

    print("tags to create:", tags_to_create)

    tags_to_create.append(
        {
            "project_tag_id": {
                "project_id": new_project_id,
                "text": conversation["project_id"]["name"],
            }
        }
    )

    # create conversation
    directus_rw.create_item(
        "conversation",
        item_data={
            "project_id": new_project_id,
            "created_at": conversation["created_at"],
            "participant_name": conversation["project_id"]["name"]
            + " - "
            + conversation["participant_name"],
            "participant_user_agent": conversation["participant_user_agent"],
            "chunks": {"create": chunks},
            # "tags": {
            #     "create": tags_to_create
            # }
        },
    )

    print(
        "created conversation",
        conversation["participant_name"],
        "in project",
        destination_project["name"],
    )


def copy_for_joost() -> None:
    source_projects = directus.get_items(
        "project",
        {
            "query": {
                "filter": {"directus_user_id": {"email": {"_contains": "joost"}}},
                "fields": ["id", "name"],
                "search": "| Break",
            }
        },
    )

    destination_project = directus.get_items(
        "project", {"query": {"filter": {"name": {"_eq": "Oikocredit R1 Main"}}}}
    )

    destination_project = destination_project[0]

    print("destination project found:", destination_project["name"])

    for project in source_projects:
        print(project["name"])

        # get the conversations with "representative" tag

        source_conversations = directus.get_items(
            "conversation",
            {
                "query": {
                    "filter": {
                        "project_id": project["id"],
                        "tags": {"_some": {"project_tag_id": {"text": {"_eq": "Representative"}}}},
                    },
                }
            },
        )

        # found convesations

        for conversation in source_conversations:
            print(
                "copying conversation",
                conversation["participant_name"],
                "to",
                destination_project["name"],
            )
            copy_conversation_to_new_project(conversation["id"], destination_project["id"])
            break


# copy_for_joost()

if __name__ == "__main__":
    print("main")

    save = directus.get_items(
        "conversation",
        {
            "query": {
                "filter": {
                    "project_id": {"_eq": "44495ec5-0161-4157-8fc0-d01f7d532821"},
                },
                "fields": ["chunks.transcript", "participant_name", "tags.project_tag_id.text"],
                "deep": {"chunks": {"_limit": 100000, "_sort": "timestamp"}},
            }
        },
    )

    conversations = []

    for s in save:
        print(f"processing {s['participant_name']}")

        transcript = ""
        for chunk in s["chunks"]:
            transcript += str(chunk["transcript"]) + "\n"

        print(f"has {len(transcript)} tokens")

        tags = ""
        for tag in s["tags"]:
            tags += tag["project_tag_id"]["text"] + ", "

        print(f"found tags: {tags}")

        conversations.append(
            {"name": s["participant_name"], "tags": tags, "transcript": transcript}
        )

    # with open("conversations_r1.json", "w") as f:
    #     json.dump(conversations, f)

    print("done")

    print("start report with deepseek")

    prompt_message = render_prompt("system_report", "en", {"conversations": conversations})

    response = litellm.completion(
        model="ollama/deepseek-r1:7b",
        api_base="http://host.docker.internal:11434",
        messages=[{"role": "user", "content": prompt_message}],
    )

    response_content = response

    # remove <article> and </article> if found
    # response_content = response_content.replace("<article>", "").replace("</article>", "")

    with open("report_r1.txt", "w") as f:
        f.write(response_content)

    print("done")
