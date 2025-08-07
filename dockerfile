# ---- Base ----
FROM python:3.11-slim

# Don’t write .pyc files, and flush stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system deps (add build tools only if you need them)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ---- App setup ----
WORKDIR /app

# Install Python deps separately for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# If your SQLite file is expected at Databases/Bookings-FP.db, make sure the folder exists
# (comment this out if you mount a volume instead)
RUN mkdir -p Databases

# Expose the port Fly will hit
EXPOSE 8080

# ---- Run ----
# If your Flask instance is `app` in app.py, this is correct.
# Adjust to `module_name:flask_app_variable` if different.
CMD ["gunicorn", "-w", "2", "-k", "gthread", "-b", "0.0.0.0:8080", "app:app", "--timeout", "120"]
