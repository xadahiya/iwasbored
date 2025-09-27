"""
This module configures a custom logger using the loguru library.
It sets up logging to stdout for DEBUG level and stderr for WARNING and ERROR levels.
"""
import sys

from loguru import logger

# Define the log format
# {time} - Timestamp in the format: Month Day, Year > Hour:Minute:Second!UTC
# {level} - Log level (e.g., DEBUG, INFO, WARNING, ERROR)
# {message} - The actual log message
# {extra} - Additional context that can be passed to the logger using .bind()
FORMAT = '{time:MMMM D, YYYY > HH:mm:ss!UTC} | {level} | {message}| {extra}'

# Remove the default logger
logger.remove(0)

# Add a new logger for stdout (console output) with DEBUG level
logger.add(sys.stdout, level='DEBUG', format=FORMAT)

# Add a new logger for stderr (error output) with WARNING level
logger.add(sys.stderr, level='WARNING', format=FORMAT)

# Add another logger for stderr with ERROR level
# This ensures that ERROR logs are captured separately from WARNINGs
logger.add(sys.stderr, level='ERROR', format=FORMAT)
