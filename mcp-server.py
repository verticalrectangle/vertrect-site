"""
VR branding MCP server.
Exposes a `generate_post` tool that renders LinkedIn post images using the VR template.

Run:  python mcp-server.py
Add to Claude Code: { "command": "python", "args": ["/path/to/mcp-server.py"] }
"""
import sys
from pathlib import Path

import mcp.server.stdio
import mcp.types as types
from mcp.server import Server
from mcp.server.models import InitializationOptions

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))
from generate_post import render  # noqa: E402  (import after path setup)

server = Server("vr-branding")


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="generate_post",
            description=(
                "Generate a Vertical Rectangle branded LinkedIn post image (1080×1080 PNG). "
                "Returns the path to the saved file."
            ),
            inputSchema={
                "type": "object",
                "required": ["layout", "title"],
                "properties": {
                    "layout": {
                        "type": "string",
                        "enum": ["announcement", "release", "quote", "flow"],
                        "description": (
                            "announcement — big title + optional subtitle/body, bottom-anchored. "
                            "release — project name + version tag + optional notes. "
                            "quote — large pull quote + attribution. "
                            "flow — pipeline/process diagram: title + subtitle (project name) + body (comma-separated steps)."
                        ),
                    },
                    "title": {
                        "type": "string",
                        "description": "Main text. For 'quote' layout this is the quote body.",
                    },
                    "subtitle": {
                        "type": "string",
                        "description": (
                            "Subtitle (announcement), version string (release), "
                            "or attribution (quote). Optional."
                        ),
                    },
                    "body": {
                        "type": "string",
                        "description": "Optional secondary copy (announcement / release only).",
                    },
                    "out": {
                        "type": "string",
                        "description": "Output file path. Defaults to a generated name in the repo root.",
                    },
                },
            },
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name != "generate_post":
        raise ValueError(f"Unknown tool: {name}")

    path = render(
        layout=arguments["layout"],
        title=arguments["title"],
        subtitle=arguments.get("subtitle", ""),
        body=arguments.get("body", ""),
        out=arguments.get("out"),
    )

    return [types.TextContent(type="text", text=f"Generated: {path}")]


async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="vr-branding",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
