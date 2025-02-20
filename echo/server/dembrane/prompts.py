"""Prompt template rendering module.

This module provides functionality for loading and rendering Jinja2 templates
from a configured templates directory. Templates are automatically loaded from
PROMPT_TEMPLATES_DIR and must have the .jinja extension.

Example:
    >>> render_prompt("context-1.jinja", {"model": "gpt-4"})
    "You are a helpful AI assistant powered by gpt-4..."

Attributes:
    env (Environment): Jinja2 environment configured with the template directory
    PROMPT_TEMPLATE_LIST (list[str]): List of available template filenames
"""

import os
import logging
from typing import Any
from collections import defaultdict

from jinja2 import Environment, FileSystemLoader, select_autoescape

from dembrane.config import PROMPT_TEMPLATES_DIR

logger = logging.getLogger("prompts")

env = Environment(
    loader=FileSystemLoader(PROMPT_TEMPLATES_DIR),
    autoescape=select_autoescape()
)

# Load all the files from PROMPT_TEMPLATES_DIR that end with .jinja
PROMPT_TEMPLATE_LIST = [f.name for f in os.scandir(PROMPT_TEMPLATES_DIR) if f.is_file() and f.name.endswith(".jinja")]

# Create a dictionary to map template names to their supported languages
template_support = defaultdict(set)
for template_name in sorted(PROMPT_TEMPLATE_LIST):
    name, lang, _ = template_name.rsplit(".", 2)
    template_support[name].add(lang)

# Log the template support matrix
header = "Name                           | de  | en  | es  | fr  | nl"
separator = "-" * len(header)
rows = []
for name, languages in template_support.items():
    # Pad the name to 19 characters to align with header
    padded_name = f"{name[:30]}{' ' * (30 - len(name[:30]))}"
    row = f"{padded_name}| " + " | ".join(
        " y " if lang in languages else " n " for lang in ["de", "en", "es", "fr", "nl"]
    )
    rows.append(row)

logger.info(f"Loaded {len(rows)} prompt templates:\n{header}\n{separator}\n" + "\n".join(rows))


def render_prompt(prompt_name: str, language: str, kwargs: dict[str, Any]) -> str:
    """Render a prompt template with the given arguments.

    Args:
        prompt_name: Name of the prompt template file (without .jinja extension)
        language: ISO 639-1 language code of the prompt template file (example: "en", "nl", "fr", "es", "de". etc.)
        kwargs: Dictionary of arguments to pass to the template renderer

    Returns:
        The rendered prompt template as a string

    Raises:
        ValueError: If the prompt template is not found in PROMPT_TEMPLATES_DIR
    """
    logger.debug(f"Rendering prompt {prompt_name} with kwargs: {kwargs.keys()}")

    full_prompt_name = f"{prompt_name}.{language}.jinja"

    # Check if the prompt with the specified language exists
    if full_prompt_name not in PROMPT_TEMPLATE_LIST:
        # Try to use the .en version if available
        default_prompt_name = f"{prompt_name}.en.jinja"
        if default_prompt_name in PROMPT_TEMPLATE_LIST:
            logger.warning(
                f"Prompt template {full_prompt_name} not found, using default {default_prompt_name}"
            )
            full_prompt_name = default_prompt_name
        else:
            raise ValueError(
                f"Prompt template {full_prompt_name} not found and no default available"
            )

    template = env.get_template(full_prompt_name)
    return template.render(**kwargs)
