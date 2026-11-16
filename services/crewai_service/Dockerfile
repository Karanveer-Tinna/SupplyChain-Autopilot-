FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY packages/contracts /app/packages/contracts
COPY requirements.txt /app/requirements.txt
RUN uv pip install --system --no-cache -e /app/packages/contracts -r /app/requirements.txt

COPY . /app

EXPOSE 8001

CMD ["uvicorn", "services.crewai_service.server:app", "--host", "0.0.0.0", "--port", "8001"]
